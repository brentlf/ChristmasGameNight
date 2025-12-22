'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLanguage, t } from '@/lib/i18n';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { useScoreboard } from '@/lib/hooks/useScoreboard';
import type { Player, Room, ScoreboardPlayer } from '@/types';

function AnimatedNumber(props: { value: number; durationMs?: number; className?: string }) {
  const { value, durationMs = 650, className } = props;
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const start = display;
    const end = value;
    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(start + (end - start) * eased);
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}

interface AggregatedPlayer {
  identityKey: string;
  name: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  rooms: string[];
  lastSeenAt: number;
  scoresByGame: {
    amazing_race: number;
    trivia: number;
    emoji: number;
    wyr: number;
    pictionary: number;
    guess_the_song: number;
    family_feud: number;
    bingo: number;
    leaderboard: number;
  };
}

type LeaderboardMode = 'global' | 'current' | 'select';

const STORAGE_KEY_ACTIVE_ROOM_ID = 'cgn_active_room_id';

function GlobalLeaderboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const modeParam = searchParams.get('mode') as LeaderboardMode | null;
  const selectedRoomIdsFromUrl = useMemo(() => {
    return searchParams.get('roomIds')?.split(',').filter(Boolean) || [];
  }, [searchParams]);
  
  const [mode, setMode] = useState<LeaderboardMode>(modeParam || 'global');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(selectedRoomIdsFromUrl);
  const [loading, setLoading] = useState(true);
  const [aggregatedPlayers, setAggregatedPlayers] = useState<AggregatedPlayer[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Array<{ id: string; name: string; code: string; createdAt: number }>>([]);
  const [showSelector, setShowSelector] = useState(false);
  const lang = getLanguage();
  const [animateBars, setAnimateBars] = useState(false);
  const isUpdatingUrlRef = useRef(false);
  
  // Sync state from URL on mount/URL change (but not from our own updates)
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false;
      return;
    }
    if (modeParam && modeParam !== mode) {
      setMode(modeParam);
    }
    const urlIdsStr = JSON.stringify(selectedRoomIdsFromUrl);
    const stateIdsStr = JSON.stringify(selectedRoomIds);
    if (urlIdsStr !== stateIdsStr) {
      setSelectedRoomIds(selectedRoomIdsFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam, selectedRoomIdsFromUrl]);
  
  // Auto-detect current room
  const currentRoomId = useMemo(() => {
    // 1. Check URL path (e.g., /room/[roomId]/...)
    const roomIdMatch = pathname?.match(/\/room\/([^/]+)/);
    if (roomIdMatch) return roomIdMatch[1];
    
    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ROOM_ID);
      if (stored) return stored;
    }
    
    return null;
  }, [pathname]);
  
  const { room: currentRoom } = useRoom(currentRoomId);
  const { scoreboard: currentRoomScoreboard } = useScoreboard(currentRoomId);

  useEffect(() => {
    const id = setTimeout(() => setAnimateBars(true), 50);
    return () => clearTimeout(id);
  }, []);

  // Load available rooms for selector
  useEffect(() => {
    if (mode !== 'select') return;
    
    async function loadRooms() {
      try {
        const roomsRef = collection(db, 'rooms');
        const roomsSnap = await getDocs(roomsRef);
        const rooms = roomsSnap.docs
          .map(doc => {
            const data = doc.data() as Room;
            // Only show public rooms (no eventId/groupId)
            if (data.eventId != null || data.groupId != null) return null;
            return {
              id: doc.id,
              name: data.name || 'Unnamed Room',
              code: data.code || '',
              createdAt: data.createdAt || 0,
            };
          })
          .filter(Boolean) as Array<{ id: string; name: string; code: string; createdAt: number }>;
        setAvailableRooms(rooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    }
    
    loadRooms();
  }, [mode]);

  // Update URL when mode/selection changes (only if different from current URL)
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (mode !== 'global') newParams.set('mode', mode);
    if (selectedRoomIds.length > 0) newParams.set('roomIds', selectedRoomIds.join(','));
    
    // Compare with current URL params
    const currentMode = searchParams.get('mode') || 'global';
    const currentRoomIds = searchParams.get('roomIds')?.split(',').filter(Boolean) || [];
    const currentParams = new URLSearchParams();
    if (currentMode !== 'global') currentParams.set('mode', currentMode);
    if (currentRoomIds.length > 0) currentParams.set('roomIds', currentRoomIds.join(','));
    
    // Only update if the query string is actually different
    if (newParams.toString() !== currentParams.toString()) {
      isUpdatingUrlRef.current = true;
      const newQuery = newParams.toString();
      router.replace(`/leaderboard${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
    }
  }, [mode, selectedRoomIds, router, searchParams]);

  // Fetch current leaderboard (auto-detect)
  useEffect(() => {
    if (mode !== 'current') return;
    
    async function fetchCurrent() {
      try {
        setLoading(true);
        
        if (currentRoomId && currentRoomScoreboard) {
          const players = Object.values(currentRoomScoreboard.players || {});
          const aggregated: AggregatedPlayer[] = players.map((sbPlayer) => ({
            identityKey: sbPlayer.playerIdentityId || sbPlayer.uid,
            name: sbPlayer.displayName,
            avatar: sbPlayer.avatar,
            totalScore: sbPlayer.totalPoints,
            gamesPlayed: sbPlayer.gamesPlayed,
            rooms: [currentRoom?.name || 'Room'],
            lastSeenAt: sbPlayer.lastUpdatedAt,
            scoresByGame: {
              amazing_race: sbPlayer.breakdown.amazing_race || 0,
              trivia: sbPlayer.breakdown.trivia || 0,
              emoji: sbPlayer.breakdown.emoji || 0,
              wyr: sbPlayer.breakdown.wyr || 0,
              pictionary: sbPlayer.breakdown.pictionary || 0,
              guess_the_song: sbPlayer.breakdown.guess_the_song || 0,
              family_feud: sbPlayer.breakdown.family_feud || 0,
              bingo: sbPlayer.breakdown.bingo || 0,
              leaderboard: 0,
            },
          }));
          
          const sorted = aggregated
            .filter((p) => Number(p.totalScore ?? 0) > 0)
            .sort((a, b) => {
              if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
              return a.name.localeCompare(b.name);
            });
          
          setAggregatedPlayers(sorted);
        } else {
          setAggregatedPlayers([]);
        }
      } catch (error) {
        console.error('Error fetching current leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCurrent();
  }, [mode, currentRoomId, currentRoomScoreboard, currentRoom]);

  // Fetch selected rooms leaderboard
  useEffect(() => {
    if (mode !== 'select' || selectedRoomIds.length === 0) {
      if (mode === 'select') setLoading(false);
      return;
    }
    
    async function fetchSelected() {
      try {
        setLoading(true);
        const playerMap = new Map<string, AggregatedPlayer>();
        
        // Aggregate from selected rooms
        for (const roomId of selectedRoomIds) {
          const roomRef = doc(db, 'rooms', roomId);
          const roomSnap = await getDoc(roomRef);
          if (!roomSnap.exists()) continue;
          
          const room = { id: roomSnap.id, ...roomSnap.data() } as Room & { id: string };
          const scoreboard = room.scoreboard;
          
          if (scoreboard?.players) {
            for (const sbPlayer of Object.values(scoreboard.players)) {
              const identityKey = sbPlayer.playerIdentityId || sbPlayer.uid;
              if (!playerMap.has(identityKey)) {
                playerMap.set(identityKey, {
                  identityKey,
                  name: sbPlayer.displayName,
                  avatar: sbPlayer.avatar,
                  totalScore: 0,
                  gamesPlayed: 0,
                  rooms: [],
                  lastSeenAt: sbPlayer.lastUpdatedAt,
                  scoresByGame: {
                    amazing_race: 0,
                    trivia: 0,
                    emoji: 0,
                    wyr: 0,
                    pictionary: 0,
                    guess_the_song: 0,
                    family_feud: 0,
                    bingo: 0,
                    leaderboard: 0,
                  },
                });
              }
              
              const aggregated = playerMap.get(identityKey)!;
              aggregated.totalScore += sbPlayer.totalPoints;
              aggregated.gamesPlayed += sbPlayer.gamesPlayed;
              if (!aggregated.rooms.includes(room.name)) {
                aggregated.rooms.push(room.name);
              }
              
              const b = sbPlayer.breakdown || {};
              aggregated.scoresByGame.amazing_race += Number(b.amazing_race ?? 0);
              aggregated.scoresByGame.trivia += Number(b.trivia ?? 0);
              aggregated.scoresByGame.emoji += Number(b.emoji ?? 0);
              aggregated.scoresByGame.wyr += Number(b.wyr ?? 0);
              aggregated.scoresByGame.pictionary += Number(b.pictionary ?? 0);
              aggregated.scoresByGame.guess_the_song += Number(b.guess_the_song ?? 0);
              aggregated.scoresByGame.family_feud += Number(b.family_feud ?? 0);
              aggregated.scoresByGame.bingo += Number(b.bingo ?? 0);
            }
          }
        }
        
        const sorted = Array.from(playerMap.values())
          .filter((p) => Number(p.totalScore ?? 0) > 0)
          .sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.name.localeCompare(b.name);
          });
        
        setAggregatedPlayers(sorted);
      } catch (error) {
        console.error('Error fetching selected leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSelected();
  }, [mode, selectedRoomIds]);

  // Fetch global leaderboard
  useEffect(() => {
    if (mode !== 'global') return;
    
    async function fetchGlobalLeaderboard() {
      try {
        const CACHE_KEY = 'cgn_global_leaderboard_v1';
        const CACHE_TTL_MS = 60_000;
        try {
          const cachedRaw = typeof window !== 'undefined' ? window.localStorage.getItem(CACHE_KEY) : null;
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as { ts: number; players: AggregatedPlayer[] };
            if (cached?.ts && Date.now() - cached.ts < CACHE_TTL_MS && Array.isArray(cached.players)) {
              setAggregatedPlayers(cached.players);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore cache parse errors
        }

        const roomsRef = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(roomsRef);
        
        const playerMap = new Map<string, AggregatedPlayer>();

        for (const roomDoc of roomsSnapshot.docs) {
          const room = { id: roomDoc.id, ...roomDoc.data() } as Room & { id: string };
          if (room.eventId != null || room.groupId != null) continue;
          
          const roomScoreboard = room.scoreboard;
          const scoreboardPlayers: ScoreboardPlayer[] = roomScoreboard?.players
            ? Object.values(roomScoreboard.players)
            : [];

          if (scoreboardPlayers.length > 0) {
            for (const sbPlayer of scoreboardPlayers) {
              const identityKey = sbPlayer.playerIdentityId || sbPlayer.uid;
              const key = identityKey;
              const lastSeenAt = Number(sbPlayer.lastUpdatedAt ?? 0);

              if (!playerMap.has(key)) {
                playerMap.set(key, {
                  identityKey,
                  name: sbPlayer.displayName,
                  avatar: sbPlayer.avatar,
                  totalScore: 0,
                  gamesPlayed: 0,
                  rooms: [],
                  lastSeenAt,
                  scoresByGame: {
                    amazing_race: 0,
                    trivia: 0,
                    emoji: 0,
                    wyr: 0,
                    pictionary: 0,
                    guess_the_song: 0,
                    family_feud: 0,
                    bingo: 0,
                    leaderboard: 0,
                  },
                });
              }

              const aggregated = playerMap.get(key)!;
              if (lastSeenAt >= (aggregated.lastSeenAt ?? 0)) {
                aggregated.name = sbPlayer.displayName;
                aggregated.avatar = sbPlayer.avatar;
                aggregated.lastSeenAt = lastSeenAt;
              }

              const totalPoints = Number(sbPlayer.totalPoints ?? 0);
              aggregated.totalScore += totalPoints;
              aggregated.gamesPlayed += Number(sbPlayer.gamesPlayed ?? 0);

              const b = sbPlayer.breakdown || {};
              aggregated.scoresByGame.amazing_race += Number(b.amazing_race ?? 0);
              aggregated.scoresByGame.trivia += Number(b.trivia ?? 0);
              aggregated.scoresByGame.emoji += Number(b.emoji ?? 0);
              aggregated.scoresByGame.wyr += Number(b.wyr ?? 0);
              aggregated.scoresByGame.pictionary += Number(b.pictionary ?? 0);
              aggregated.scoresByGame.guess_the_song += Number(b.guess_the_song ?? 0);
              aggregated.scoresByGame.family_feud += Number(b.family_feud ?? 0);
              aggregated.scoresByGame.bingo += Number(b.bingo ?? 0);

              if (!aggregated.rooms.includes(room.name)) {
                aggregated.rooms.push(room.name);
              }
            }
            continue;
          }

          if (room.status !== 'finished') continue;

          const playersRef = collection(db, 'rooms', room.id, 'players');
          const playersSnapshot = await getDocs(playersRef);

          playersSnapshot.forEach((playerDoc) => {
            const player = { uid: playerDoc.id, ...playerDoc.data() } as Player;
            const identityKey = player.playerIdentityId || player.uid;
            const key = identityKey;
            const playerLastSeenAt = Number(player.lastSeenAt ?? player.lastActiveAt ?? player.joinedAt ?? 0);
            
            if (!playerMap.has(key)) {
              playerMap.set(key, {
                identityKey,
                name: player.name,
                avatar: player.avatar,
                totalScore: 0,
                gamesPlayed: 0,
                rooms: [],
                lastSeenAt: playerLastSeenAt,
                scoresByGame: {
                  amazing_race: 0,
                  trivia: 0,
                  emoji: 0,
                  wyr: 0,
                  pictionary: 0,
                  guess_the_song: 0,
                  family_feud: 0,
                  bingo: 0,
                  leaderboard: 0,
                },
              });
            }

            const aggregated = playerMap.get(key)!;
            if (playerLastSeenAt >= (aggregated.lastSeenAt ?? 0)) {
              aggregated.name = player.name;
              aggregated.avatar = player.avatar;
              aggregated.lastSeenAt = playerLastSeenAt;
            }
            const playerScore = player.score ?? 0;
            
            if (room.roomMode === 'amazing_race') {
              aggregated.scoresByGame.amazing_race += playerScore;
              aggregated.totalScore += playerScore;
              aggregated.gamesPlayed += 1;
            } else if (room.roomMode === 'mini_games') {
              let hasIndividualScores = false;
              let miniGameTotal = 0;
              
              if (player.miniGameProgress) {
                if (player.miniGameProgress.trivia !== undefined) {
                  const triviaScore = player.miniGameProgress.trivia?.score ?? 0;
                  aggregated.scoresByGame.trivia += triviaScore;
                  miniGameTotal += triviaScore;
                  hasIndividualScores = true;
                }
                if (player.miniGameProgress.emoji !== undefined) {
                  const emojiScore = player.miniGameProgress.emoji?.score ?? 0;
                  aggregated.scoresByGame.emoji += emojiScore;
                  miniGameTotal += emojiScore;
                  hasIndividualScores = true;
                }
                if (player.miniGameProgress.pictionary !== undefined) {
                  const pictionaryScore = player.miniGameProgress.pictionary?.score ?? 0;
                  aggregated.scoresByGame.pictionary += pictionaryScore;
                  miniGameTotal += pictionaryScore;
                  hasIndividualScores = true;
                }
                if (player.miniGameProgress.guess_the_song !== undefined) {
                  const gtsScore = player.miniGameProgress.guess_the_song?.score ?? 0;
                  aggregated.scoresByGame.guess_the_song += gtsScore;
                  miniGameTotal += gtsScore;
                  hasIndividualScores = true;
                }
                if (player.miniGameProgress.family_feud !== undefined) {
                  const ffScore = player.miniGameProgress.family_feud?.score ?? 0;
                  aggregated.scoresByGame.family_feud += ffScore;
                  miniGameTotal += ffScore;
                  hasIndividualScores = true;
                }
                if (player.miniGameProgress.bingo !== undefined) {
                  const bingoScore = player.miniGameProgress.bingo?.score ?? 0;
                  aggregated.scoresByGame.bingo += bingoScore;
                  miniGameTotal += bingoScore;
                  hasIndividualScores = true;
                }
              }
              
              if (!hasIndividualScores) {
                const totalMiniGameScore = player.totalMiniGameScore ?? playerScore;
                miniGameTotal = totalMiniGameScore;
                const enabledGames = room.miniGamesEnabled || [];
                if (enabledGames.length > 0 && totalMiniGameScore > 0) {
                  const scoringGames = enabledGames.filter(g => g !== 'wyr');
                  if (scoringGames.length > 0) {
                    const perGame = totalMiniGameScore / scoringGames.length;
                    enabledGames.forEach(game => {
                      if (game === 'trivia') aggregated.scoresByGame.trivia += perGame;
                      if (game === 'emoji') aggregated.scoresByGame.emoji += perGame;
                      if (game === 'pictionary') aggregated.scoresByGame.pictionary += perGame;
                      if (game === 'guess_the_song') aggregated.scoresByGame.guess_the_song += perGame;
                      if (game === 'family_feud') aggregated.scoresByGame.family_feud += perGame;
                    });
                  }
                }
              }
              
              aggregated.totalScore += miniGameTotal > 0 ? miniGameTotal : playerScore;
              aggregated.gamesPlayed += 1;
            } else if (room.roomMode === 'leaderboard') {
              aggregated.scoresByGame.leaderboard += playerScore;
              aggregated.totalScore += playerScore;
              aggregated.gamesPlayed += 1;
            }
            
            if (!aggregated.rooms.includes(room.name)) {
              aggregated.rooms.push(room.name);
            }
          });
        }

        const sorted = Array.from(playerMap.values())
          .filter((p) => Number(p.totalScore ?? 0) > 0)
          .sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.name.localeCompare(b.name);
          });

        setAggregatedPlayers(sorted);
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), players: sorted }));
          }
        } catch {
          // ignore cache write errors
        }
      } catch (error) {
        console.error('Error fetching global leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGlobalLeaderboard();
  }, [mode]);

  const top3 = aggregatedPlayers.slice(0, 3);
  const rest = aggregatedPlayers.slice(3);

  const getGameBreakdown = (player: AggregatedPlayer) => {
    const games = [
      { key: 'amazing_race', label: 'Amazing Race', emoji: '🎄', color: 'bg-christmas-green', value: player.scoresByGame.amazing_race },
      { key: 'trivia', label: 'Trivia', emoji: '⚡', color: 'bg-blue-500', value: player.scoresByGame.trivia },
      { key: 'emoji', label: 'Emoji', emoji: '🎬', color: 'bg-purple-500', value: player.scoresByGame.emoji },
      { key: 'pictionary', label: 'Pictionary', emoji: '🎨', color: 'bg-orange-500', value: player.scoresByGame.pictionary },
      { key: 'guess_the_song', label: 'Guess the Song', emoji: '🎵', color: 'bg-sky-500', value: player.scoresByGame.guess_the_song },
      { key: 'family_feud', label: 'Family Feud', emoji: '🎯', color: 'bg-christmas-red', value: player.scoresByGame.family_feud },
      { key: 'bingo', label: 'Bingo', emoji: '🎱', color: 'bg-pink-500', value: player.scoresByGame.bingo },
      { key: 'leaderboard', label: 'Leaderboard', emoji: '🏆', color: 'bg-christmas-gold', value: player.scoresByGame.leaderboard },
    ].filter(g => g.value > 0);
    return games;
  };

  const ScoreBreakdown = ({ player }: { player: AggregatedPlayer }) => {
    const games = getGameBreakdown(player);
    if (games.length === 0) return null;

    return (
      <div className="mt-2 md:mt-3">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
          <span className="text-xs text-white/60">Score Breakdown:</span>
        </div>
        <div className="h-3 md:h-4 w-full rounded-full overflow-hidden bg-white/10 flex">
          {games.map((game) => {
            const percentage = (game.value / player.totalScore) * 100;
            return (
              <div
                key={game.key}
                className={`${game.color} transition-all`}
                style={{ width: `${animateBars ? percentage : 0}%` }}
                title={`${game.label}: ${game.value}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
          {games.map((game) => {
            const percentage = (game.value / player.totalScore) * 100;
            return (
              <div
                key={game.key}
                className="flex items-center gap-1 text-xs"
              >
                <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded ${game.color}`} />
                <span className="text-white/80">
                  {game.emoji} {game.label}: {game.value} ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleToggleRoom = (roomId: string) => {
    const newIds = selectedRoomIds.includes(roomId)
      ? selectedRoomIds.filter(id => id !== roomId)
      : [...selectedRoomIds, roomId];
    setSelectedRoomIds(newIds);
  };

  if (loading) {
    return (
      <main className="h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-4 md:mb-6 text-center shrink-0">
          {/* Mode Selector */}
          <div className="flex justify-center gap-2 mb-4 md:mb-6">
            <button
              onClick={() => setMode('global')}
              className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition ${
                mode === 'global'
                  ? 'bg-christmas-gold text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🌍 Global
            </button>
            <button
              onClick={() => setMode('current')}
              className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition ${
                mode === 'current'
                  ? 'bg-christmas-gold text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📍 Current {currentRoomId && `(${currentRoom?.name || currentRoomId.slice(0, 6)}...)`}
            </button>
            <button
              onClick={() => {
                setMode('select');
                setShowSelector(true);
              }}
              className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition ${
                mode === 'select'
                  ? 'bg-christmas-gold text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🎯 Select
            </button>
          </div>
          
          <div className="inline-flex items-center gap-1.5 md:gap-2 rounded-full bg-white/10 border border-white/20 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-md">
            <span>🏆</span>
            <span>
              {mode === 'global' && 'Global'}
              {mode === 'current' && (currentRoomId ? 'Room' : 'Current')}
              {mode === 'select' && 'Selected'}
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/70 hidden sm:inline">Leaderboard</span>
          </div>
          <h1 className="game-show-title text-3xl md:text-5xl lg:text-6xl text-center mt-3 md:mt-4">
            {t('common.leaderboard', lang)}
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-white/70 mt-2 md:mt-4">
            {mode === 'global' && 'All-time scores across all games'}
            {mode === 'current' && (
              currentRoomId 
                ? `Room: ${currentRoom?.name || currentRoomId}` 
                : 'No active room detected'
            )}
            {mode === 'select' && (
              selectedRoomIds.length > 0
                ? `${selectedRoomIds.length} room(s) selected`
                : 'Select rooms to compare'
            )}
          </p>
        </div>

        {/* Selector Modal */}
        {mode === 'select' && showSelector && (
          <div className="card mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold">Select Rooms</h2>
              <button
                onClick={() => setShowSelector(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableRooms.length === 0 ? (
                <p className="text-white/60 text-sm">No rooms available</p>
              ) : (
                availableRooms
                  .sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
                  .map(room => {
                    const date = new Date(room.createdAt);
                    const dateStr = date.toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <label key={room.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded">
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={() => handleToggleRoom(room.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span>{room.name} ({room.code})</span>
                          <span className="text-xs text-white/50">{dateStr}</span>
                        </div>
                      </label>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* Podium */}
        {aggregatedPlayers.length > 0 && (
          <div className="card mb-4 md:mb-6 relative overflow-hidden shrink-0 cgn-animate-in">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-red/15 blur-3xl" />

            <div className="relative">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-center">🏆 Top Players</h2>
              <div className="flex justify-center items-end gap-2 md:gap-4">
                {top3[1] && (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4">{top3[1].avatar}</div>
                    <div className="bg-white/20 w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-t-xl md:rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl lg:text-4xl font-bold">2</span>
                    </div>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold mt-1.5 md:mt-2">{top3[1].name}</p>
                    <p className="text-base md:text-lg lg:text-xl text-christmas-gold">
                      <AnimatedNumber value={top3[1].totalScore} className="tabular-nums" /> {t('common.score', lang)}
                    </p>
                    <p className="text-xs md:text-sm text-white/60 mt-0.5 md:mt-1">
                      {top3[1].gamesPlayed} {top3[1].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-2 md:mt-3 w-full max-w-[150px] md:max-w-[200px]">
                      <ScoreBreakdown player={top3[1]} />
                    </div>
                  </div>
                )}
                {top3[0] && (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4">{top3[0].avatar}</div>
                    <div className="bg-christmas-gold/80 w-20 h-24 md:w-28 md:h-32 lg:w-32 lg:h-40 rounded-t-xl md:rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl lg:text-4xl font-bold">1</span>
                    </div>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold mt-1.5 md:mt-2">{top3[0].name}</p>
                    <p className="text-base md:text-lg lg:text-xl text-christmas-gold">
                      <AnimatedNumber value={top3[0].totalScore} className="tabular-nums" /> {t('common.score', lang)}
                    </p>
                    <p className="text-xs md:text-sm text-white/60 mt-0.5 md:mt-1">
                      {top3[0].gamesPlayed} {top3[0].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-2 md:mt-3 w-full max-w-[150px] md:max-w-[200px]">
                      <ScoreBreakdown player={top3[0]} />
                    </div>
                  </div>
                )}
                {top3[2] && (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4">{top3[2].avatar}</div>
                    <div className="bg-christmas-bronze/80 w-20 h-16 md:w-28 md:h-20 lg:w-32 lg:h-24 rounded-t-xl md:rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-2xl md:text-3xl lg:text-4xl font-bold">3</span>
                    </div>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold mt-1.5 md:mt-2">{top3[2].name}</p>
                    <p className="text-base md:text-lg lg:text-xl text-christmas-gold">
                      <AnimatedNumber value={top3[2].totalScore} className="tabular-nums" /> {t('common.score', lang)}
                    </p>
                    <p className="text-xs md:text-sm text-white/60 mt-0.5 md:mt-1">
                      {top3[2].gamesPlayed} {top3[2].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-2 md:mt-3 w-full max-w-[150px] md:max-w-[200px]">
                      <ScoreBreakdown player={top3[2]} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        {aggregatedPlayers.length > 0 ? (
          <div className="card cgn-animate-in">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-center break-words">{t('common.leaderboard', lang)}</h2>
            <div className="space-y-2 md:space-y-3">
              {aggregatedPlayers.map((player, index) => (
                <div
                  key={`${player.name}-${player.avatar}-${index}`}
                  className={`flex items-center gap-2 md:gap-4 p-4 md:p-5 lg:p-6 rounded-xl md:rounded-2xl border border-white/10 min-h-[80px] md:min-h-[100px] cgn-animate-in ${
                    index < 3 ? 'bg-christmas-gold/15' : 'bg-white/5'
                  }`}
                >
                  <div className={`text-xl md:text-2xl lg:text-3xl font-bold w-8 md:w-10 lg:w-12 text-center shrink-0 ${
                    index === 0 ? 'text-christmas-gold' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-christmas-bronze' : 'text-white/50'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-2xl md:text-3xl shrink-0">{player.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base md:text-lg lg:text-xl font-semibold truncate break-words">{player.name}</p>
                    <p className="text-xs md:text-sm text-white/60 mb-1.5 md:mb-2 break-words">
                      {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} played
                    </p>
                    <ScoreBreakdown player={player} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg md:text-xl lg:text-2xl font-bold tabular-nums">
                      <AnimatedNumber value={player.totalScore} />
                    </p>
                    <p className="text-xs md:text-sm text-white/60 break-words">{t('common.score', lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card mb-6 md:mb-8 text-center flex-1 flex items-center justify-center">
            <p className="text-base md:text-lg lg:text-xl text-white/70">
              {mode === 'current' && !currentRoomId && 'No active room detected. Join a room first.'}
              {mode === 'select' && selectedRoomIds.length === 0 && 'Select rooms to view their leaderboards.'}
              {(mode === 'global' || (mode === 'current' && currentRoomId) || (mode === 'select' && selectedRoomIds.length > 0)) && 'No games completed yet. Play some games to see the leaderboard!'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-4 mt-4 md:mt-6 shrink-0">
          <Link href="/game-night" className="btn-secondary text-sm md:text-base">
            Back to Game Night
          </Link>
          <Link href="/" className="btn-primary text-sm md:text-base">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GlobalLeaderboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="text-2xl">{getLanguage() === 'cs' ? 'Načítání...' : 'Loading...'}</div>
          </div>
        </div>
      </main>
    }>
      <GlobalLeaderboardPageContent />
    </Suspense>
  );
}
