import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Player, RaceStageDefinition, Room } from '@/types';
import {
  christmasRaceV1,
  codePuzzles,
  emojiClues,
  finalRiddlePool,
  getTriviaPool,
  photoPrompts,
  riddleGatePool,
} from '@/content/raceTracks/christmas_race_v1';
import { generateSeed, pickRandomIdsSeeded } from '@/lib/utils/seededRandom';
import { fuzzyMatchGuess } from '@/lib/utils/guessing';

export type RaceLang = 'en' | 'cs';

export function getRaceTrack(trackId: Room['raceTrackId']) {
  if (trackId !== 'christmas_race_v1') {
    throw new Error(`Unknown raceTrackId: ${trackId}`);
  }
  return christmasRaceV1;
}

export function getStageByIndex(trackId: Room['raceTrackId'], stageIndex: number): RaceStageDefinition | null {
  const track = getRaceTrack(trackId);
  return track.stages[stageIndex] ?? null;
}

export function getTotalStages(trackId: Room['raceTrackId']): number {
  return getRaceTrack(trackId).stages.length;
}

export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeSpeedBonusMs(startedAt: number | undefined, completedAt: number, maxBonus = 5): number {
  if (!startedAt) return 0;
  const durMs = Math.max(0, completedAt - startedAt);
  // Friendly step curve (family vibe):
  // <=30s:5, <=60s:4, <=90s:3, <=120s:2, <=180s:1 else 0
  const steps: Array<[number, number]> = [
    [30_000, 5],
    [60_000, 4],
    [90_000, 3],
    [120_000, 2],
    [180_000, 1],
  ];
  const found = steps.find(([ms]) => durMs <= ms);
  return Math.min(maxBonus, found ? found[1] : 0);
}

async function logEvent(roomId: string, payload: { type: string; playerName: string; stageTitle?: string }) {
  // Events are optional; if rules/structure disallow it, ignore silently.
  try {
    await addDoc(collection(db, 'rooms', roomId, 'events'), {
      ...payload,
      createdAt: Date.now(),
      createdAtServer: serverTimestamp(),
    });
  } catch {
    // no-op
  }
}

export async function ensureStageInitialized(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  room?: Room;
}): Promise<void> {
  const { roomId, uid, trackId, stageIndex, room } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage) return;

  // Get room data if not provided (for AI-enhanced mode check)
  let roomData = room;
  if (!roomData) {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);
    if (roomSnap.exists()) {
      roomData = { id: roomSnap.id, ...roomSnap.data() } as Room;
    }
  }

  // Check if AI-enhanced mode is enabled and content exists
  const isAIEnhanced = roomData?.raceAiEnhanced ?? false;
  const aiStageContent = isAIEnhanced ? roomData?.raceStageQuestions?.[stage.id] : null;

  // Valid-id sets to repair older/stale stored ids (prevents "❓" / missing options in stage 2).
  const emojiIdSet = new Set(emojiClues.map((c) => c.id));
  const triviaIdSet = new Set(getTriviaPool('en').map((q) => q.id));
  const codePuzzleIdSet = new Set(codePuzzles.map((p) => p.id));
  const photoPromptIdSet = new Set(photoPrompts.map((p) => p.id));
  const riddleGateIdSet = new Set(riddleGatePool.map((r) => r.id));
  const finalRiddleIdSet = new Set(finalRiddlePool.map((r) => r.id));

  const allValidIds = (ids: any, valid: Set<string>) =>
    Array.isArray(ids) && ids.length > 0 && ids.every((x) => typeof x === 'string' && valid.has(x));

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) return;
    const p = snap.data() as Player;
    const stageState = (p.stageState ?? {}) as Record<string, any>;
    const existing = (stageState[stage.id] ?? {}) as any;

    // Determine whether the player stage state is "complete enough" to render.
    // This doubles as a repair mechanism for older rooms where raceStageQuestions existed
    // but some stage-specific fields were missing (e.g., emoji clueIds).
    // For AI-enhanced mode, accept AI-generated IDs (they start with "ai_")
    const hasRequiredPlayerFields = (() => {
      if (!existing?.startedAt) return false;
      if (stage.type === 'riddle_gate') {
        const needCorrect = stage.content?.needCorrect ?? 1;
        if (needCorrect > 1) {
          const rids = existing.riddleIds;
          const solved = existing.solvedRiddles ?? [];
          if (!Array.isArray(rids) || rids.length < needCorrect) return false;
          if (isAIEnhanced) {
            return rids.every((id) => typeof id === 'string' && id.startsWith('ai_')) && solved.length >= needCorrect;
          }
          return allValidIds(rids, riddleGateIdSet) && solved.length >= needCorrect;
        } else {
          const rid = existing.riddleId;
          return typeof rid === 'string' && (riddleGateIdSet.has(rid) || (isAIEnhanced && rid.startsWith('ai_')));
        }
      }
      if (stage.type === 'final_riddle') {
        const rid = existing.riddleId;
        return typeof rid === 'string' && (finalRiddleIdSet.has(rid) || (isAIEnhanced && rid.startsWith('ai_')));
      }
      if (stage.type === 'emoji_guess') {
        const ids = existing.clueIds;
        if (!Array.isArray(ids) || ids.length === 0) return false;
        if (isAIEnhanced) return ids.every((id) => typeof id === 'string' && id.startsWith('ai_'));
        return allValidIds(ids, emojiIdSet);
      }
      if (stage.type === 'trivia_solo') {
        const ids = existing.questionIds;
        if (!Array.isArray(ids) || ids.length === 0) return false;
        if (isAIEnhanced) return ids.every((id) => typeof id === 'string' && id.startsWith('ai_'));
        return allValidIds(ids, triviaIdSet);
      }
      if (stage.type === 'code_lock') {
        const needCorrect = stage.content?.needCorrect ?? 1;
        if (needCorrect > 1) {
          const pids = existing.puzzleIds;
          const solved = existing.solvedCodes ?? [];
          if (!Array.isArray(pids) || pids.length < needCorrect) return false;
          return allValidIds(pids, codePuzzleIdSet) && solved.length >= needCorrect;
        } else {
          return typeof existing.puzzleId === 'string' && codePuzzleIdSet.has(existing.puzzleId);
        }
      }
      if (stage.type === 'photo_scavenger') return typeof existing.promptId === 'string' && photoPromptIdSet.has(existing.promptId);
      return true;
    })();

    // IMPORTANT: Do NOT write stage questions to the room doc.
    // Firestore rules only allow the controller to update the room doc, so writing here would
    // break stage initialization for regular players (leading to "❓" and no options).
    // Instead, generate deterministically from (roomId, stageIndex) so every player sees the same content.
    // OR use AI-generated content if available.
    const stageQuestions: any = {};
    
    if (aiStageContent) {
      // Use AI-generated content if available
      if (stage.type === 'riddle_gate' || stage.type === 'final_riddle') {
        const pickCount = stage.content?.pick ?? 1;
        if (pickCount > 1 && stage.type === 'riddle_gate') {
          stageQuestions.riddleIds = aiStageContent.riddleIds;
          stageQuestions.riddles = aiStageContent.riddles; // Store full riddle objects
        } else {
          stageQuestions.riddleId = aiStageContent.riddleId;
          stageQuestions.riddle = aiStageContent.riddle; // Store full riddle object for later retrieval
        }
      }
      if (stage.type === 'emoji_guess') {
        stageQuestions.clueIds = aiStageContent.clueIds;
        stageQuestions.clues = aiStageContent.clues; // Store full clue objects
      }
      if (stage.type === 'trivia_solo') {
        stageQuestions.questionIds = aiStageContent.questionIds;
        stageQuestions.questions = aiStageContent.questions; // Store full question objects
      }
      // code_lock and photo_scavenger don't support AI generation, use static
      if (stage.type === 'code_lock') {
        const seed = generateSeed(roomId, stageIndex);
        stageQuestions.puzzleId = pickRandomIdsSeeded(codePuzzles, 1, seed)[0];
      }
      if (stage.type === 'photo_scavenger') {
        const seed = generateSeed(roomId, stageIndex);
        stageQuestions.promptId = pickRandomIdsSeeded(photoPrompts, 1, seed)[0];
      }
    } else {
      // Use static content with seeded random
      const seed = generateSeed(roomId, stageIndex);
      if (stage.type === 'riddle_gate') {
        const pickCount = stage.content?.pick ?? 1;
        if (pickCount > 1) {
          stageQuestions.riddleIds = pickRandomIdsSeeded(riddleGatePool, pickCount, seed);
        } else {
          stageQuestions.riddleId = pickRandomIdsSeeded(riddleGatePool, 1, seed)[0];
        }
      }
      if (stage.type === 'final_riddle') {
        stageQuestions.riddleId = pickRandomIdsSeeded(finalRiddlePool, 1, seed)[0];
      }
      if (stage.type === 'emoji_guess') stageQuestions.clueIds = pickRandomIdsSeeded(emojiClues, 8, seed);
      if (stage.type === 'trivia_solo') stageQuestions.questionIds = pickRandomIdsSeeded(getTriviaPool('en'), 10, seed);
      if (stage.type === 'code_lock') {
        const pickCount = stage.content?.pick ?? 1;
        if (pickCount > 1) {
          stageQuestions.puzzleIds = pickRandomIdsSeeded(codePuzzles, pickCount, seed);
        } else {
          stageQuestions.puzzleId = pickRandomIdsSeeded(codePuzzles, 1, seed)[0];
        }
      }
      if (stage.type === 'photo_scavenger') stageQuestions.promptId = pickRandomIdsSeeded(photoPrompts, 1, seed)[0];
      if (stage.type === 'final_riddle') stageQuestions.riddleId = pickRandomIdsSeeded(finalRiddlePool, 1, seed)[0];
    }

    // If the player already has a complete stage state, no further work is needed.
    if (hasRequiredPlayerFields) return;

    // Use the room's stored questions for this player
    const now = Date.now();
    const base: any = {
      // Keep an existing startedAt if it exists, otherwise start now
      startedAt: existing.startedAt ?? now,
      // Preserve attempts if they exist
      attempts: existing.attempts ?? 0,
    };

    if (stage.type === 'riddle_gate') {
      const needCorrect = stage.content?.needCorrect ?? 1;
      if (needCorrect > 1) {
        const existingIds = existing.riddleIds;
        const solved = existing.solvedRiddles ?? [];
        if (isAIEnhanced && Array.isArray(existingIds) && existingIds.length > 0 && existingIds.every(id => typeof id === 'string' && id.startsWith('ai_'))) {
          base.riddleIds = existingIds;
        } else if (allValidIds(existingIds, riddleGateIdSet)) {
          base.riddleIds = existingIds;
        } else {
          base.riddleIds = (stageQuestions as any).riddleIds;
        }
        base.solvedRiddles = solved;
        base.currentRiddleIndex = existing.currentRiddleIndex ?? 0;
      } else {
        const rid = existing.riddleId;
        if (isAIEnhanced && typeof rid === 'string' && rid.startsWith('ai_')) {
          base.riddleId = rid;
        } else if (typeof rid === 'string' && riddleGateIdSet.has(rid)) {
          base.riddleId = rid;
        } else {
          base.riddleId = (stageQuestions as any).riddleId;
        }
      }
    }
    if (stage.type === 'emoji_guess') {
      const existingIds = existing.clueIds;
      if (isAIEnhanced && Array.isArray(existingIds) && existingIds.length > 0 && existingIds.every(id => typeof id === 'string' && id.startsWith('ai_'))) {
        base.clueIds = existingIds; // Keep existing AI IDs
      } else if (allValidIds(existingIds, emojiIdSet)) {
        base.clueIds = existingIds; // Keep existing static IDs
      } else {
        base.clueIds = (stageQuestions as any).clueIds; // Use generated IDs
      }
      base.correctCount = existing.correctCount ?? 0;
      base.answered = existing.answered ?? {};
      base.lockoutUntil = existing.lockoutUntil ?? 0;
    }
    if (stage.type === 'trivia_solo') {
      const existingIds = existing.questionIds;
      if (isAIEnhanced && Array.isArray(existingIds) && existingIds.length > 0 && existingIds.every(id => typeof id === 'string' && id.startsWith('ai_'))) {
        base.questionIds = existingIds; // Keep existing AI IDs
      } else if (allValidIds(existingIds, triviaIdSet)) {
        base.questionIds = existingIds; // Keep existing static IDs
      } else {
        base.questionIds = (stageQuestions as any).questionIds; // Use generated IDs
      }
      base.current = existing.current ?? 0;
      base.correctCount = existing.correctCount ?? 0;
      base.answers = existing.answers ?? {};
      base.questionStartedAt = existing.questionStartedAt ?? now;
    }
    if (stage.type === 'code_lock') {
      const needCorrect = stage.content?.needCorrect ?? 1;
      if (needCorrect > 1) {
        const existingIds = existing.puzzleIds;
        const solved = existing.solvedCodes ?? [];
        if (allValidIds(existingIds, codePuzzleIdSet)) {
          base.puzzleIds = existingIds;
        } else {
          base.puzzleIds = (stageQuestions as any).puzzleIds;
        }
        base.solvedCodes = solved;
        base.currentPuzzleIndex = existing.currentPuzzleIndex ?? 0;
        base.lockoutUntil = existing.lockoutUntil ?? 0;
      } else {
        const pid = existing.puzzleId;
        base.puzzleId = (typeof pid === 'string' && codePuzzleIdSet.has(pid)) ? pid : (stageQuestions as any).puzzleId;
        base.lockoutUntil = existing.lockoutUntil ?? 0;
      }
    }
    if (stage.type === 'photo_scavenger') {
      const pr = existing.promptId;
      base.promptId = (typeof pr === 'string' && photoPromptIdSet.has(pr)) ? pr : (stageQuestions as any).promptId;
      base.photoUrl = existing.photoUrl ?? null;
      base.photoUploaded = existing.photoUploaded ?? false;
      base.done = existing.done ?? false;
    }
    if (stage.type === 'final_riddle') {
      const rid = existing.riddleId;
      if (isAIEnhanced && typeof rid === 'string' && rid.startsWith('ai_')) {
        base.riddleId = rid; // Keep existing AI ID
      } else if (typeof rid === 'string' && finalRiddleIdSet.has(rid)) {
        base.riddleId = rid; // Keep existing static ID
      } else {
        base.riddleId = (stageQuestions as any).riddleId; // Use generated ID
      }
    }

    tx.update(playerRef, {
      stageState: { ...(p.stageState ?? {}), [stage.id]: base },
      lastActiveAt: now,
    } as any);
  });
}

export async function submitRiddleAnswer(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  answer: string;
  lang: RaceLang;
}): Promise<{ correct: boolean; lockedOutUntil?: number; finished?: boolean }> {
  const { roomId, uid, trackId, stageIndex, answer, lang } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage || (stage.type !== 'riddle_gate' && stage.type !== 'final_riddle')) {
    throw new Error('Not a riddle stage');
  }

  const totalStages = getTotalStages(trackId);
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const now = Date.now();

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) throw new Error('Player not found');
    const p = snap.data() as Player;
    if (p.stageIndex !== stageIndex) return { correct: false };

    const state = (p.stageState?.[stage.id] ?? {}) as any;
    const needCorrect = stage.content?.needCorrect ?? 1;
    
    // Get room to check for AI content
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await tx.get(roomRef);
    const room = roomSnap.exists() ? { id: roomSnap.id, ...roomSnap.data() } as Room : null;
    
    // Handle multiple riddles
    if (needCorrect > 1 && stage.type === 'riddle_gate') {
      const riddleIds = state.riddleIds as string[] | undefined;
      const solvedRiddles = (state.solvedRiddles ?? []) as string[];
      const currentIndex = state.currentRiddleIndex ?? 0;
      
      if (!riddleIds || currentIndex >= riddleIds.length) {
        return { correct: false };
      }
      
      const currentRiddleId = riddleIds[currentIndex];
      if (solvedRiddles.includes(currentRiddleId)) {
        // Already solved, move to next
        const nextIndex = currentIndex + 1;
        const allSolved = solvedRiddles.length >= needCorrect;
        
        if (allSolved) {
          const basePoints = 10 * needCorrect;
          const speedBonus = computeSpeedBonusMs(state.startedAt, now, 5);
          const nextStageIndex = stageIndex + 1;
          const finished = nextStageIndex >= totalStages;
          
          tx.update(playerRef, {
            score: (p.score ?? 0) + basePoints + speedBonus,
            stageIndex: finished ? totalStages : nextStageIndex,
            finishedAt: finished ? now : p.finishedAt ?? null,
            lastActiveAt: now,
            stageState: {
              ...(p.stageState ?? {}),
              [stage.id]: {
                ...state,
                completedAt: now,
              },
            },
          } as any);
          return { correct: true, finished, playerName: p.name };
        }
        
        tx.update(playerRef, {
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...state,
              currentRiddleIndex: nextIndex,
            },
          },
        } as any);
        return { correct: true, finished: false, playerName: p.name };
      }
      
      // Try to get AI riddle first, then fallback to static pool
      let riddle: any = null;
      if (room && room.raceAiEnhanced && room.raceStageQuestions?.[stage.id]?.riddles) {
        riddle = room.raceStageQuestions[stage.id].riddles?.find((r: any) => r.id === currentRiddleId);
      }
      if (!riddle) {
        riddle = riddleGatePool.find((r) => r.id === currentRiddleId);
      }
      if (!riddle) return { correct: false };
      
      const normalized = normalizeAnswer(answer);
      const accepted = (riddle?.answers?.[lang] ?? []).map(normalizeAnswer);
      const correct = accepted.includes(normalized);
      
      if (!correct) {
        tx.update(playerRef, {
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...state,
              attempts: (state.attempts ?? 0) + 1,
            },
          },
        } as any);
        return { correct: false };
      }
      
      // Correct answer - mark as solved
      const newSolved = [...solvedRiddles, currentRiddleId];
      const allSolved = newSolved.length >= needCorrect;
      const nextIndex = currentIndex + 1;
      
      if (allSolved) {
        const basePoints = 10 * needCorrect;
        const speedBonus = computeSpeedBonusMs(state.startedAt, now, 5);
        const nextStageIndex = stageIndex + 1;
        const finished = nextStageIndex >= totalStages;
        
        tx.update(playerRef, {
          score: (p.score ?? 0) + basePoints + speedBonus,
          stageIndex: finished ? totalStages : nextStageIndex,
          finishedAt: finished ? now : p.finishedAt ?? null,
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...state,
              solvedRiddles: newSolved,
              completedAt: now,
            },
          },
        } as any);
        return { correct: true, finished, playerName: p.name };
      }
      
      // Move to next riddle
      tx.update(playerRef, {
        score: (p.score ?? 0) + 10, // Points per riddle
        lastActiveAt: now,
        stageState: {
          ...(p.stageState ?? {}),
          [stage.id]: {
            ...state,
            solvedRiddles: newSolved,
            currentRiddleIndex: nextIndex,
          },
        },
      } as any);
      return { correct: true, finished: false, playerName: p.name };
    }
    
    // Single riddle (original logic)
    const riddleId = state.riddleId as string | undefined;
    let riddle: any = null;
    if (room && room.raceAiEnhanced && room.raceStageQuestions?.[stage.id]?.riddle) {
      riddle = room.raceStageQuestions[stage.id].riddle;
    }
    if (!riddle) {
      const pool = stage.type === 'riddle_gate' ? riddleGatePool : finalRiddlePool;
      riddle = pool.find((r) => r.id === riddleId) ?? pool[0];
    }
    const normalized = normalizeAnswer(answer);
    const accepted = (riddle?.answers?.[lang] ?? []).map(normalizeAnswer);
    const correct = accepted.includes(normalized);
    if (!correct) {
      tx.update(playerRef, {
        lastActiveAt: now,
        stageState: {
          ...(p.stageState ?? {}),
          [stage.id]: {
            ...state,
            attempts: (state.attempts ?? 0) + 1,
          },
        },
      } as any);
      return { correct: false };
    }

    const basePoints = stage.type === 'riddle_gate' ? 10 : 25;
    const speedBonus = computeSpeedBonusMs(state.startedAt, now, 5);
    const nextStageIndex = stageIndex + 1;
    const finished = nextStageIndex >= totalStages;

    const nextState = {
      ...state,
      completedAt: now,
      attempts: state.attempts ?? 0,
    };

    tx.update(playerRef, {
      score: (p.score ?? 0) + basePoints + speedBonus,
      stageIndex: finished ? totalStages : nextStageIndex,
      finishedAt: finished ? now : p.finishedAt ?? null,
      lastActiveAt: now,
      stageState: { ...(p.stageState ?? {}), [stage.id]: nextState },
    } as any);

    return { correct: true, finished, playerName: p.name };
  }).then(async (res: any) => {
    if (res.correct) {
      await logEvent(roomId, { type: 'stage_completed', playerName: res.playerName ?? 'Player', stageTitle: stage.title[lang] });
    }
    const { playerName: _pn, ...rest } = res;
    return rest;
  });
}

export async function submitEmojiAnswer(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  clueId: string;
  answerText: string;
  lang: RaceLang;
}): Promise<{ correct: boolean; completedStage: boolean; lockoutUntil?: number }> {
  const { roomId, uid, trackId, stageIndex, clueId, answerText, lang } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage || stage.type !== 'emoji_guess') throw new Error('Not emoji stage');

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const now = Date.now();

  const res: any = await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) throw new Error('Player not found');
    const p = snap.data() as Player;
    if (p.stageIndex !== stageIndex) return { correct: false, completedStage: false };

    const st = (p.stageState?.[stage.id] ?? {}) as any;
    const lockoutUntil = st.lockoutUntil ?? 0;
    if (lockoutUntil && now < lockoutUntil) {
      return { correct: false, completedStage: false, lockoutUntil };
    }

    // Get room to check for AI content
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await tx.get(roomRef);
    const room = roomSnap.exists() ? { id: roomSnap.id, ...roomSnap.data() } as Room : null;
    
    // Try to get AI clue first, then fallback to static pool
    let clue: any = null;
    if (room && room.raceAiEnhanced && room.raceStageQuestions?.[stage.id]?.clues) {
      clue = room.raceStageQuestions[stage.id].clues?.find((c: any) => c.id === clueId);
    }
    if (!clue) {
      clue = emojiClues.find((c) => c.id === clueId);
    }
    if (!clue) throw new Error('Clue not found');

    // Robust correctness:
    // - Some content uses curly apostrophes/quotes (e.g. Rockin’ vs Rockin') which breaks strict equality.
    // - In rare cases options may not include the exact correct string for a locale.
    // We treat answers as correct if they fuzzy-match the correct title in either language,
    // or any provided aliases (AI emoji generation may include these).
    const targets: string[] = [
      (clue?.correct?.[lang] ?? '').toString(),
      (clue?.correct?.en ?? '').toString(),
      (clue?.correct?.cs ?? '').toString(),
      ...(Array.isArray(clue?.acceptedAliases?.en) ? clue.acceptedAliases.en : []).map((s: any) => String(s ?? '')),
      ...(Array.isArray(clue?.acceptedAliases?.cs) ? clue.acceptedAliases.cs : []).map((s: any) => String(s ?? '')),
    ].filter((s) => s.trim().length > 0);

    const correct = targets.some((t) => fuzzyMatchGuess(answerText, t));
    const answered = { ...(st.answered ?? {}) };
    if (answered[clueId]) {
      return { correct: Boolean(answered[clueId].correct), completedStage: false, lockoutUntil: st.lockoutUntil ?? 0 };
    }

    let correctCount = Number(st.correctCount ?? 0);
    if (correct) correctCount += 1;

    answered[clueId] = { answerText, correct, answeredAt: now };

    const needCorrect = stage.content.needCorrect ?? 3;
    const completedStage = correctCount >= needCorrect;

    const nextStageIndex = stageIndex + 1;
    const totalStages = getTotalStages(trackId);

    const updatedStageState: any = {
      ...st,
      answered,
      correctCount,
      attempts: (st.attempts ?? 0) + (correct ? 0 : 1),
      lockoutUntil: correct ? 0 : now + (stage.content.lockoutMs ?? 10_000),
      completedAt: completedStage ? now : st.completedAt ?? null,
    };

    const updates: any = {
      lastActiveAt: now,
      stageState: { ...(p.stageState ?? {}), [stage.id]: updatedStageState },
    };

    if (completedStage) {
      const basePoints = 15;
      const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);
      updates.score = (p.score ?? 0) + basePoints + speedBonus;
      updates.stageIndex = Math.min(totalStages, nextStageIndex);
    }

    tx.update(playerRef, updates);
    return { correct, completedStage, lockoutUntil: updatedStageState.lockoutUntil, playerName: p.name };
  });

  if (res?.completedStage) {
    await logEvent(roomId, { type: 'stage_completed', playerName: res.playerName ?? 'Player', stageTitle: stage.title[lang] });
  }

  const { playerName: _pn, ...rest } = res;
  return rest;
}

export async function submitTriviaAnswer(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  questionId: string;
  choiceIndex: number | null; // null means timeout / no answer
  lang: RaceLang;
}): Promise<{ done: boolean; correct?: boolean; current: number }> {
  const { roomId, uid, trackId, stageIndex, questionId, choiceIndex } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage || stage.type !== 'trivia_solo') throw new Error('Not trivia stage');

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const now = Date.now();

  const res: any = await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) throw new Error('Player not found');
    const p = snap.data() as Player;
    if (p.stageIndex !== stageIndex) return { done: false, current: 0 };

    const st = (p.stageState?.[stage.id] ?? {}) as any;
    const questionIds: string[] = st.questionIds ?? [];
    const current: number = st.current ?? 0;
    if (questionIds[current] !== questionId) {
      return { done: false, current };
    }

    // Get room to check for AI content
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await tx.get(roomRef);
    const room = roomSnap.exists() ? { id: roomSnap.id, ...roomSnap.data() } as Room : null;
    
    // Try to get AI question first, then fallback to static pool
    let question: any = null;
    if (room && room.raceAiEnhanced && room.raceStageQuestions?.[stage.id]?.questions) {
      question = room.raceStageQuestions[stage.id].questions?.find((q: any) => q.id === questionId);
    }
    if (!question) {
      const qPool = getTriviaPool('en');
      question = qPool.find((qq) => qq.id === questionId);
    }
    if (!question) throw new Error('Question not found');

    const answeredMap = { ...(st.answers ?? {}) };
    if (answeredMap[questionId]) {
      return { done: false, current };
    }

    const isCorrect = choiceIndex !== null && choiceIndex === question.correctIndex;
    answeredMap[questionId] = {
      choiceIndex,
      correct: isCorrect,
      answeredAt: now,
    };

    const correctCount = Number(st.correctCount ?? 0) + (isCorrect ? 1 : 0);
    const nextCurrent = current + 1;
    const done = nextCurrent >= questionIds.length;

    const updates: any = {
      lastActiveAt: now,
      stageState: {
        ...(p.stageState ?? {}),
        [stage.id]: {
          ...st,
          answers: answeredMap,
          correctCount,
          current: nextCurrent,
          questionStartedAt: now,
          completedAt: done ? now : st.completedAt ?? null,
        },
      },
    };

    // +4 per correct, total up to 20
    const deltaPoints = isCorrect ? 4 : 0;
    updates.score = (p.score ?? 0) + deltaPoints;

    if (done) {
      const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);
      updates.score = (updates.score as number) + speedBonus;
      updates.stageIndex = Math.min(getTotalStages(trackId), stageIndex + 1);
    }

    tx.update(playerRef, updates);
    return { done, correct: isCorrect, current: nextCurrent, playerName: p.name };
  });

  if (res?.done) {
    await logEvent(roomId, { type: 'stage_completed', playerName: res.playerName ?? 'Player', stageTitle: stage.title[params.lang] });
  }
  const { playerName: _pn, ...rest } = res;
  return rest;
}

export async function submitCodeLock(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  code: string;
  lang: RaceLang;
}): Promise<{ correct: boolean; lockoutUntil?: number }> {
  const { roomId, uid, trackId, stageIndex, code } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage || stage.type !== 'code_lock') throw new Error('Not code lock stage');

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const now = Date.now();
  const needCorrect = stage.content?.needCorrect ?? 1;

  const res: any = await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) throw new Error('Player not found');
    const p = snap.data() as Player;
    if (p.stageIndex !== stageIndex) return { correct: false };

    const st = (p.stageState?.[stage.id] ?? {}) as any;
    const lockoutUntil = st.lockoutUntil ?? 0;
    if (lockoutUntil && now < lockoutUntil) {
      return { correct: false, lockoutUntil };
    }

    // Handle multiple codes
    if (needCorrect > 1) {
      const puzzleIds = st.puzzleIds as string[] | undefined;
      const solvedCodes = (st.solvedCodes ?? []) as string[];
      const currentIndex = st.currentPuzzleIndex ?? 0;
      
      if (!puzzleIds || currentIndex >= puzzleIds.length) {
        return { correct: false };
      }
      
      const currentPuzzleId = puzzleIds[currentIndex];
      if (solvedCodes.includes(currentPuzzleId)) {
        // Already solved, move to next
        const nextIndex = currentIndex + 1;
        const allSolved = solvedCodes.length >= needCorrect;
        
        if (allSolved) {
          const basePoints = 15 * needCorrect;
          const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);
          tx.update(playerRef, {
            score: (p.score ?? 0) + basePoints + speedBonus,
            stageIndex: Math.min(getTotalStages(trackId), stageIndex + 1),
            lastActiveAt: now,
            stageState: {
              ...(p.stageState ?? {}),
              [stage.id]: {
                ...st,
                completedAt: now,
              },
            },
          } as any);
          return { correct: true, playerName: p.name };
        }
        
        tx.update(playerRef, {
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...st,
              currentPuzzleIndex: nextIndex,
            },
          },
        } as any);
        return { correct: true, playerName: p.name };
      }
      
      const puzzle = codePuzzles.find((c) => c.id === currentPuzzleId) ?? codePuzzles[0];
      const normalizedInput = code.trim().replace(/\D/g, '').padStart(4, '0').slice(0, 4);
      const normalizedPuzzleCode = String(puzzle.code).trim().replace(/\D/g, '').padStart(4, '0').slice(0, 4);
      const correct = normalizedInput === normalizedPuzzleCode;
      
      if (!correct) {
        const nextLockout = now + (stage.content.lockoutMs ?? 10_000);
        tx.update(playerRef, {
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...st,
              attempts: (st.attempts ?? 0) + 1,
              lockoutUntil: nextLockout,
            },
          },
        } as any);
        return { correct: false, lockoutUntil: nextLockout };
      }
      
      // Correct answer - mark as solved
      const newSolved = [...solvedCodes, currentPuzzleId];
      const allSolved = newSolved.length >= needCorrect;
      const nextIndex = currentIndex + 1;
      
      if (allSolved) {
        const basePoints = 15 * needCorrect;
        const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);
        tx.update(playerRef, {
          score: (p.score ?? 0) + basePoints + speedBonus,
          stageIndex: Math.min(getTotalStages(trackId), stageIndex + 1),
          lastActiveAt: now,
          stageState: {
            ...(p.stageState ?? {}),
            [stage.id]: {
              ...st,
              solvedCodes: newSolved,
              completedAt: now,
            },
          },
        } as any);
        return { correct: true, playerName: p.name };
      }
      
      // Move to next code
      tx.update(playerRef, {
        score: (p.score ?? 0) + 15, // Points per code
        lastActiveAt: now,
        stageState: {
          ...(p.stageState ?? {}),
          [stage.id]: {
            ...st,
            solvedCodes: newSolved,
            currentPuzzleIndex: nextIndex,
            lockoutUntil: 0,
          },
        },
      } as any);
      return { correct: true, playerName: p.name };
    }

    // Single code (original logic)
    const puzzle = codePuzzles.find((c) => c.id === st.puzzleId) ?? codePuzzles[0];
    const normalizedInput = code.trim().replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    const normalizedPuzzleCode = String(puzzle.code).trim().replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    const correct = normalizedInput === normalizedPuzzleCode;

    if (!correct) {
      const nextLockout = now + (stage.content.lockoutMs ?? 10_000);
      tx.update(playerRef, {
        lastActiveAt: now,
        stageState: {
          ...(p.stageState ?? {}),
          [stage.id]: { ...st, attempts: (st.attempts ?? 0) + 1, lockoutUntil: nextLockout },
        },
      } as any);
      return { correct: false, lockoutUntil: nextLockout };
    }

    const basePoints = 15;
    const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);
    tx.update(playerRef, {
      score: (p.score ?? 0) + basePoints + speedBonus,
      stageIndex: Math.min(getTotalStages(trackId), stageIndex + 1),
      lastActiveAt: now,
      stageState: { ...(p.stageState ?? {}), [stage.id]: { ...st, completedAt: now } },
    } as any);

    return { correct: true, playerName: p.name };
  });

  if (res?.correct) {
    await logEvent(roomId, { type: 'stage_completed', playerName: res.playerName ?? 'Player', stageTitle: stage.title[params.lang] });
  }
  const { playerName: _pn, ...rest } = res;
  return rest;
}

export async function completePhotoScavenger(params: {
  roomId: string;
  uid: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  aiValidated?: boolean;
  confidence?: number;
  lang: RaceLang;
}): Promise<{ completed: boolean }> {
  const { roomId, uid, trackId, stageIndex, aiValidated, confidence } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage || stage.type !== 'photo_scavenger') throw new Error('Not photo stage');

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const now = Date.now();

  const res: any = await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) throw new Error('Player not found');
    const p = snap.data() as Player;
    if (p.stageIndex !== stageIndex) return { completed: false };

    const st = (p.stageState?.[stage.id] ?? {}) as any;
    const alreadyDone = Boolean(st.done);
    if (alreadyDone) return { completed: true };

    const basePoints = 10;
    // Award bonus only if AI validated the photo (confidence >= 0.6)
    const photoBonus = aiValidated && (confidence ?? 0) >= 0.6 ? Number(stage.content.photoBonus ?? 5) : 0;
    const speedBonus = computeSpeedBonusMs(st.startedAt, now, 5);

    tx.update(playerRef, {
      score: (p.score ?? 0) + basePoints + photoBonus + speedBonus,
      stageIndex: Math.min(getTotalStages(trackId), stageIndex + 1),
      lastActiveAt: now,
      photoUploaded: Boolean(aiValidated),
      stageState: {
        ...(p.stageState ?? {}),
        [stage.id]: {
          ...st,
          done: true,
          completedAt: now,
          aiValidated: Boolean(aiValidated),
          confidence: confidence ?? 0,
          photoUploaded: Boolean(aiValidated),
        },
      },
    } as any);

    return { completed: true, playerName: p.name };
  });

  if (res?.completed) {
    await logEvent(roomId, { type: 'stage_completed', playerName: res.playerName ?? 'Player', stageTitle: stage.title[params.lang] });
  }
  const { playerName: _pn, ...rest } = res;
  return rest;
}

