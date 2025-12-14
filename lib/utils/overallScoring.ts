import type { Player, Room } from '@/types';

export interface OverallScoringResult {
  playerUid: string;
  playerName: string;
  playerAvatar: string;
  racePlacement: number | null; // 1, 2, 3, or null if not finished
  racePlacementPoints: number;
  miniGamePoints: {
    trivia: number;
    emoji: number;
    wyr: number;
    pictionary: number;
    participation: number;
    total: number;
  };
  overallPoints: number;
}

/**
 * Calculate overall scoring for all players
 */
export function calculateOverallScoring(
  players: Player[],
  room: Room
): OverallScoringResult[] {
  if (!room.overallScoringEnabled) {
    return [];
  }

  const mode = room.overallScoringMode || 'hybrid';

  // Sort players by race completion (finished first, then by stage)
  const raceSorted = [...players].sort((a, b) => {
    const aFinished = a.finishedAt ? 1 : 0;
    const bFinished = b.finishedAt ? 1 : 0;
    if (aFinished !== bFinished) return bFinished - aFinished;
    if (aFinished) {
      return (a.finishedAt || 0) - (b.finishedAt || 0);
    }
    return (b.stageIndex || 0) - (a.stageIndex || 0);
  });

  // Assign race placements
  const racePlacements = new Map<string, number>();
  let currentPlace = 1;
  for (let i = 0; i < raceSorted.length; i++) {
    if (i > 0 && raceSorted[i].finishedAt && raceSorted[i - 1].finishedAt) {
      if (raceSorted[i].finishedAt !== raceSorted[i - 1].finishedAt) {
        currentPlace = i + 1;
      }
    } else if (i > 0 && !raceSorted[i].finishedAt && !raceSorted[i - 1].finishedAt) {
      // Both not finished, same placement
    } else if (i > 0) {
      currentPlace = i + 1;
    }
    racePlacements.set(raceSorted[i].uid, currentPlace);
  }

  // Calculate race placement points
  const racePlacementPoints = (placement: number | null): number => {
    if (placement === null) return 0;
    if (placement === 1) return 50;
    if (placement === 2) return 30;
    if (placement === 3) return 20;
    return 10;
  };

  // Sort mini game players by score for each game
  const miniGameRankings = {
    trivia: [...players]
      .filter((p) => p.miniGameProgress?.trivia?.completedAt)
      .sort((a, b) => (b.miniGameProgress?.trivia?.score || 0) - (a.miniGameProgress?.trivia?.score || 0)),
    emoji: [...players]
      .filter((p) => p.miniGameProgress?.emoji?.completedAt)
      .sort((a, b) => (b.miniGameProgress?.emoji?.score || 0) - (a.miniGameProgress?.emoji?.score || 0)),
    wyr: [...players]
      .filter((p) => p.miniGameProgress?.wyr?.completedAt)
      .sort((a, b) => (b.miniGameProgress?.wyr?.score || 0) - (a.miniGameProgress?.wyr?.score || 0)),
    pictionary: [...players]
      .filter((p) => p.miniGameProgress?.pictionary?.completedAt)
      .sort((a, b) => (b.miniGameProgress?.pictionary?.score || 0) - (a.miniGameProgress?.pictionary?.score || 0)),
  };

  const miniGamePlacementPoints = (placement: number | null): number => {
    if (placement === null) return 0;
    if (placement === 1) return 15;
    if (placement === 2) return 10;
    if (placement === 3) return 5;
    return 0;
  };

  // Calculate points for each player
  const results: OverallScoringResult[] = players.map((player) => {
    const racePlacement = player.finishedAt ? racePlacements.get(player.uid) || null : null;
    const racePoints = racePlacementPoints(racePlacement);

    // Mini game points
    const triviaPlacement = miniGameRankings.trivia.findIndex((p) => p.uid === player.uid) + 1 || null;
    const triviaPoints = triviaPlacement > 0 ? miniGamePlacementPoints(triviaPlacement) : 0;
    const triviaParticipation = player.miniGameProgress?.trivia?.completedAt ? 5 : 0;

    const emojiPlacement = miniGameRankings.emoji.findIndex((p) => p.uid === player.uid) + 1 || null;
    const emojiPoints = emojiPlacement > 0 ? miniGamePlacementPoints(emojiPlacement) : 0;
    const emojiParticipation = player.miniGameProgress?.emoji?.completedAt ? 5 : 0;

    const wyrPlacement = miniGameRankings.wyr.findIndex((p) => p.uid === player.uid) + 1 || null;
    const wyrPoints = wyrPlacement > 0 ? miniGamePlacementPoints(wyrPlacement) : 0;
    const wyrParticipation = player.miniGameProgress?.wyr?.completedAt ? 5 : 0;

    const pictionaryPlacement = miniGameRankings.pictionary.findIndex((p) => p.uid === player.uid) + 1 || null;
    const pictionaryPoints = pictionaryPlacement > 0 ? miniGamePlacementPoints(pictionaryPlacement) : 0;
    const pictionaryParticipation = player.miniGameProgress?.pictionary?.completedAt ? 5 : 0;

    const participationTotal = triviaParticipation + emojiParticipation + wyrParticipation + pictionaryParticipation;
    const placementTotal = triviaPoints + emojiPoints + wyrPoints + pictionaryPoints;

    let overallPoints = 0;
    if (mode === 'placements') {
      overallPoints = racePoints + placementTotal + participationTotal;
    } else if (mode === 'sumMiniGameScores') {
      const miniGameScoreTotal =
        (player.miniGameProgress?.trivia?.score || 0) +
        (player.miniGameProgress?.emoji?.score || 0) +
        (player.miniGameProgress?.wyr?.score || 0) +
        (player.miniGameProgress?.pictionary?.score || 0);
      overallPoints = miniGameScoreTotal;
    } else {
      // hybrid
      const miniGameScoreTotal =
        (player.miniGameProgress?.trivia?.score || 0) +
        (player.miniGameProgress?.emoji?.score || 0) +
        (player.miniGameProgress?.wyr?.score || 0) +
        (player.miniGameProgress?.pictionary?.score || 0);
      overallPoints = racePoints + placementTotal + participationTotal + Math.floor(miniGameScoreTotal / 10);
    }

    return {
      playerUid: player.uid,
      playerName: player.name,
      playerAvatar: player.avatar,
      racePlacement,
      racePlacementPoints: racePoints,
      miniGamePoints: {
        trivia: triviaPoints + triviaParticipation,
        emoji: emojiPoints + emojiParticipation,
        wyr: wyrPoints + wyrParticipation,
        pictionary: pictionaryPoints + pictionaryParticipation,
        participation: participationTotal,
        total: placementTotal + participationTotal,
      },
      overallPoints,
    };
  });

  return results.sort((a, b) => b.overallPoints - a.overallPoints);
}
