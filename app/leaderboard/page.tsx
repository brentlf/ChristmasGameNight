'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getLanguage, t } from '@/lib/i18n';
import Link from 'next/link';
import type { Player, Room } from '@/types';

interface AggregatedPlayer {
  name: string;
  avatar: string;
  totalScore: number;
  gamesPlayed: number;
  rooms: string[];
  scoresByGame: {
    amazing_race: number;
    trivia: number;
    emoji: number;
    wyr: number;
    pictionary: number;
    leaderboard: number;
  };
}

export default function GlobalLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [aggregatedPlayers, setAggregatedPlayers] = useState<AggregatedPlayer[]>([]);
  const lang = getLanguage();

  useEffect(() => {
    async function fetchGlobalLeaderboard() {
      try {
        // Get all rooms
        const roomsRef = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(roomsRef);
        
        const playerMap = new Map<string, AggregatedPlayer>();

        // Process each room
        for (const roomDoc of roomsSnapshot.docs) {
          const room = { id: roomDoc.id, ...roomDoc.data() } as Room & { id: string };
          
          // Count finished rooms and running rooms (in case scores are already recorded)
          if (room.status !== 'finished' && room.status !== 'running') continue;

          // Get all players from this room
          const playersRef = collection(db, 'rooms', room.id, 'players');
          const playersSnapshot = await getDocs(playersRef);

          playersSnapshot.forEach((playerDoc) => {
            const player = { uid: playerDoc.id, ...playerDoc.data() } as Player;
            
            // Use name+avatar as the key to aggregate across rooms
            const key = `${player.name}|${player.avatar}`;
            
            if (!playerMap.has(key)) {
              playerMap.set(key, {
                name: player.name,
                avatar: player.avatar,
                totalScore: 0,
                gamesPlayed: 0,
                rooms: [],
                scoresByGame: {
                  amazing_race: 0,
                  trivia: 0,
                  emoji: 0,
                  wyr: 0,
                  pictionary: 0,
                  leaderboard: 0,
                },
              });
            }

            const aggregated = playerMap.get(key)!;
            const playerScore = player.score ?? 0;
            
            // Track score by game type
            if (room.roomMode === 'amazing_race') {
              aggregated.scoresByGame.amazing_race += playerScore;
              aggregated.totalScore += playerScore;
              aggregated.gamesPlayed += 1;
            } else if (room.roomMode === 'mini_games') {
              // For mini games, track individual game scores from miniGameProgress
              let hasIndividualScores = false;
              let miniGameTotal = 0;
              
              if (player.miniGameProgress) {
                // Check each game type - include even if score is 0 (game was played)
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
                // WYR doesn't count for points - it's just for fun/getting to know everyone
                // if (player.miniGameProgress.wyr !== undefined) {
                //   const wyrScore = player.miniGameProgress.wyr?.score ?? 0;
                //   aggregated.scoresByGame.wyr += wyrScore;
                //   miniGameTotal += wyrScore;
                //   hasIndividualScores = true;
                // }
                if (player.miniGameProgress.pictionary !== undefined) {
                  const pictionaryScore = player.miniGameProgress.pictionary?.score ?? 0;
                  aggregated.scoresByGame.pictionary += pictionaryScore;
                  miniGameTotal += pictionaryScore;
                  hasIndividualScores = true;
                }
              }
              
              // Fallback: if no individual scores found, use totalMiniGameScore or playerScore
              if (!hasIndividualScores) {
                const totalMiniGameScore = player.totalMiniGameScore ?? playerScore;
                miniGameTotal = totalMiniGameScore;
                // Distribute proportionally if we have enabled games
                const enabledGames = room.miniGamesEnabled || [];
                if (enabledGames.length > 0 && totalMiniGameScore > 0) {
                  // Exclude wyr from scoring games
                  const scoringGames = enabledGames.filter(g => g !== 'wyr');
                  if (scoringGames.length > 0) {
                    const perGame = totalMiniGameScore / scoringGames.length;
                    enabledGames.forEach(game => {
                      if (game === 'trivia') aggregated.scoresByGame.trivia += perGame;
                      if (game === 'emoji') aggregated.scoresByGame.emoji += perGame;
                      // wyr doesn't count for points
                      if (game === 'pictionary') aggregated.scoresByGame.pictionary += perGame;
                    });
                  }
                }
              }
              
              // Add the mini game total to the overall score
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

        // Convert map to array and sort by total score
        const sorted = Array.from(playerMap.values()).sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          return a.name.localeCompare(b.name);
        });

        setAggregatedPlayers(sorted);
      } catch (error) {
        console.error('Error fetching global leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGlobalLeaderboard();
  }, []);

  const top3 = aggregatedPlayers.slice(0, 3);
  const rest = aggregatedPlayers.slice(3);

  // Helper function to get game breakdown data
  const getGameBreakdown = (player: AggregatedPlayer) => {
    const games = [
      { key: 'amazing_race', label: 'Amazing Race', emoji: '🎄', color: 'bg-christmas-green', value: player.scoresByGame.amazing_race },
      { key: 'trivia', label: 'Trivia', emoji: '⚡', color: 'bg-blue-500', value: player.scoresByGame.trivia },
      { key: 'emoji', label: 'Emoji', emoji: '🎬', color: 'bg-purple-500', value: player.scoresByGame.emoji },
      // wyr doesn't count for points - excluded from breakdown
      { key: 'pictionary', label: 'Pictionary', emoji: '🎨', color: 'bg-orange-500', value: player.scoresByGame.pictionary },
      { key: 'leaderboard', label: 'Leaderboard', emoji: '🏆', color: 'bg-christmas-gold', value: player.scoresByGame.leaderboard },
    ].filter(g => g.value > 0);
    return games;
  };

  // Visual breakdown component
  const ScoreBreakdown = ({ player }: { player: AggregatedPlayer }) => {
    const games = getGameBreakdown(player);
    if (games.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/60">Score Breakdown:</span>
        </div>
        {/* Visual bar chart */}
        <div className="h-4 w-full rounded-full overflow-hidden bg-white/10 flex">
          {games.map((game) => {
            const percentage = (game.value / player.totalScore) * 100;
            return (
              <div
                key={game.key}
                className={`${game.color} transition-all`}
                style={{ width: `${percentage}%` }}
                title={`${game.label}: ${game.value}`}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-2">
          {games.map((game) => {
            const percentage = (game.value / player.totalScore) * 100;
            return (
              <div
                key={game.key}
                className="flex items-center gap-1 text-xs"
              >
                <div className={`w-3 h-3 rounded ${game.color}`} />
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

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-10 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🏆</span>
            <span>Global</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">Leaderboard</span>
          </div>
          <h1 className="game-show-title text-6xl text-center mt-4">
            {t('common.leaderboard', lang)}
          </h1>
          <p className="text-lg text-white/70 mt-4">
            All-time scores across all games
          </p>
        </div>

        {/* Podium */}
        {aggregatedPlayers.length > 0 && (
          <div className="card mb-8 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-red/15 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold mb-6 text-center">🏆 Top Players</h2>
              <div className="flex justify-center items-end gap-4">
                {top3[1] && (
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">{top3[1].avatar}</div>
                    <div className="bg-white/20 w-32 h-32 rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-4xl font-bold">2</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{top3[1].name}</p>
                    <p className="text-xl text-christmas-gold">
                      {top3[1].totalScore} {t('common.score', lang)}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {top3[1].gamesPlayed} {top3[1].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-3 w-full max-w-[200px]">
                      <ScoreBreakdown player={top3[1]} />
                    </div>
                  </div>
                )}
                {top3[0] && (
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">{top3[0].avatar}</div>
                    <div className="bg-christmas-gold/80 w-32 h-40 rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-4xl font-bold">1</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{top3[0].name}</p>
                    <p className="text-xl text-christmas-gold">
                      {top3[0].totalScore} {t('common.score', lang)}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {top3[0].gamesPlayed} {top3[0].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-3 w-full max-w-[200px]">
                      <ScoreBreakdown player={top3[0]} />
                    </div>
                  </div>
                )}
                {top3[2] && (
                  <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">{top3[2].avatar}</div>
                    <div className="bg-christmas-bronze/80 w-32 h-24 rounded-t-2xl border border-white/20 flex items-center justify-center">
                      <span className="text-4xl font-bold">3</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{top3[2].name}</p>
                    <p className="text-xl text-christmas-gold">
                      {top3[2].totalScore} {t('common.score', lang)}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {top3[2].gamesPlayed} {top3[2].gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                    <div className="mt-3 w-full max-w-[200px]">
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
          <div className="card mb-8">
            <h2 className="text-4xl font-bold mb-6 text-center">{t('common.leaderboard', lang)}</h2>
            <div className="space-y-3">
              {aggregatedPlayers.map((player, index) => (
                <div
                  key={`${player.name}-${player.avatar}-${index}`}
                  className={`flex items-center gap-4 p-4 rounded-2xl border border-white/10 ${
                    index < 3 ? 'bg-christmas-gold/15' : 'bg-white/5'
                  }`}
                >
                  <div className={`text-3xl font-bold w-12 text-center ${
                    index === 0 ? 'text-christmas-gold' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-christmas-bronze' : 'text-white/50'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-3xl">{player.avatar}</span>
                  <div className="flex-1">
                    <p className="text-xl font-semibold">{player.name}</p>
                    <p className="text-xs text-white/60 mb-2">
                      {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} played
                    </p>
                    {/* Visual score breakdown */}
                    <ScoreBreakdown player={player} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{player.totalScore}</p>
                    <p className="text-xs text-white/60">{t('common.score', lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card mb-8 text-center">
            <p className="text-xl text-white/70">
              No games completed yet. Play some games to see the leaderboard!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/game-night" className="btn-secondary">
            Back to Game Night
          </Link>
          <Link href="/" className="btn-primary">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
