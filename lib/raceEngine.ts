import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
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

function pickRandomIds<T extends { id: string }>(pool: T[], count: number): string[] {
  const copy = [...pool];
  // Fisher-Yates shuffle
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length)).map((x) => x.id);
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
}): Promise<void> {
  const { roomId, uid, trackId, stageIndex } = params;
  const stage = getStageByIndex(trackId, stageIndex);
  if (!stage) return;

  const playerRef = doc(db, 'rooms', roomId, 'players', uid);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(playerRef);
    if (!snap.exists()) return;
    const p = snap.data() as Player;
    const stageState = (p.stageState ?? {}) as Record<string, any>;
    if (stageState[stage.id]?.startedAt) return;

    const now = Date.now();
    const base: any = { startedAt: now, attempts: 0 };

    if (stage.type === 'riddle_gate') {
      base.riddleId = pickRandomIds(riddleGatePool, 1)[0];
    }
    if (stage.type === 'emoji_guess') {
      base.clueIds = pickRandomIds(emojiClues, 5);
      base.correctCount = 0;
      base.answered = {};
      base.lockoutUntil = 0;
    }
    if (stage.type === 'trivia_solo') {
      // store ids only; language can change later
      const ids = pickRandomIds(getTriviaPool('en'), 5);
      base.questionIds = ids;
      base.current = 0;
      base.correctCount = 0;
      base.answers = {};
      base.questionStartedAt = now;
    }
    if (stage.type === 'code_lock') {
      base.puzzleId = pickRandomIds(codePuzzles, 1)[0];
      base.lockoutUntil = 0;
    }
    if (stage.type === 'photo_scavenger') {
      base.promptId = pickRandomIds(photoPrompts, 1)[0];
      base.photoUrl = null;
      base.photoUploaded = false;
      base.done = false;
    }
    if (stage.type === 'final_riddle') {
      base.riddleId = pickRandomIds(finalRiddlePool, 1)[0];
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
    const riddleId = state.riddleId as string | undefined;
    const pool = stage.type === 'riddle_gate' ? riddleGatePool : finalRiddlePool;
    const riddle = pool.find((r) => r.id === riddleId) ?? pool[0];
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

    const clue = emojiClues.find((c) => c.id === clueId);
    if (!clue) throw new Error('Clue not found');

    const correct = answerText === clue.correct.en || answerText === clue.correct.cs || answerText === clue.correct[lang];
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

    const qPool = getTriviaPool('en');
    const question = qPool.find((qq) => qq.id === questionId);
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

    const puzzle = codePuzzles.find((c) => c.id === st.puzzleId) ?? codePuzzles[0];
    // Normalize the input: trim, remove all non-digits, pad to 4 digits with leading zeros if needed
    const normalizedInput = code.trim().replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    // Normalize the puzzle code to ensure consistent comparison
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

