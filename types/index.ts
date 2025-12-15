export type RoomStatus = 'lobby' | 'running' | 'finished';
export type RoomMode = 'amazing_race' | 'mini_games' | 'leaderboard';
export type MiniGameType = 'trivia' | 'emoji' | 'wyr' | 'pictionary';

export interface Room {
  id: string;
  code: string;
  name: string;
  pinEnabled: boolean;
  /**
   * Hashed PIN (sha256 hex). We avoid storing the raw pin in Firestore.
   * Optional when pinEnabled=false.
   */
  pinHash?: string;
  pin?: string; // For spec compatibility (though we prefer pinHash)
  maxPlayers: number;
  createdAt: number; // ms since epoch
  controllerUid: string;
  status: RoomStatus;
  roomMode: RoomMode; // The mode this room is configured for
  raceTrackId: 'christmas_race_v1'; // Only used when roomMode is 'amazing_race'
  raceStartedAt?: number; // ms since epoch
  // Enabled mini games (only used when roomMode is 'mini_games')
  miniGamesEnabled?: MiniGameType[];
  // Mini games selected sets (generated once per room when mini games are enabled)
  miniGames?: {
    trivia?: { selectedIds: string[] };
    emoji?: { selectedIds: string[] };
    wyr?: { selectedIds: string[] };
    pictionary?: { selectedIds: string[] };
  };
  // Pictionary game state (for multiplayer rounds)
  pictionaryGameState?: {
    status: 'waiting' | 'drawing' | 'round_end' | 'completed';
    currentRound: number; // 1-indexed
    currentDrawerUid: string | null;
    currentPromptId: string | null;
    roundStartTime: number | null; // ms since epoch
    timeLimit: number; // seconds
    // Firestore does not allow `undefined` values in writes unless ignoreUndefinedProperties is enabled.
    // We use null to represent "no drawing yet".
    drawingData?: string | null; // base64 encoded canvas data for real-time sync
    guesses: Array<{ uid: string; guess: string; timestamp: number }>;
    correctGuessers: string[]; // UIDs who guessed correctly
    roundScores: Record<string, number>; // uid -> points for current round
    totalScores?: Record<string, number>; // uid -> total points across whole game
    totalRounds: number; // total rounds (2 per player)
    drawerOrder: string[]; // order of players who will draw
    promptDeck?: string[]; // promptId per round (index = round-1)
  };
  settings: {
    difficulty: 'easy' | 'medium' | 'hard';
    allowSkips: boolean;
  };
  eventsEnabled: boolean;
  // Overall scoring (meta layer)
  overallScoringEnabled?: boolean;
  overallScoringMode?: 'placements' | 'sumMiniGameScores' | 'hybrid';
  // Race stage questions (stored per stage to ensure all players see same questions)
  raceStageQuestions?: Record<string, {
    riddleId?: string;
    clueIds?: string[];
    questionIds?: string[];
    puzzleId?: string;
    promptId?: string;
  }>;
}

export type RaceStageType =
  | 'riddle_gate'
  | 'emoji_guess'
  | 'trivia_solo'
  | 'code_lock'
  | 'photo_scavenger'
  | 'final_riddle';

export type RaceEventType = 'stage_completed' | 'bonus_awarded' | 'joined';

export interface Player {
  uid: string;
  name: string;
  avatar: string;
  score: number;
  joinedAt: number; // ms since epoch
  stageIndex: number; // 0-based. stageIndex === totalStages means finished.
  stageState: Record<string, any>;
  finishedAt?: number; // ms since epoch
  lastActiveAt?: number; // ms since epoch
  photoUploaded?: boolean; // convenience flag for TV (stage 5 bonus)
  // Amazing Race (spec-compliant naming)
  raceStageIndex?: number; // Alias for stageIndex
  raceStageState?: Record<string, any>; // Alias for stageState
  raceFinishedAt?: number; // Alias for finishedAt
  // Mini games progress
  miniGameProgress?: {
    trivia?: { answers: number[]; score: number; completedAt?: number };
    emoji?: { answers: string[]; score: number; completedAt?: number };
    wyr?: { choices: ('A' | 'B')[]; score: number; completedAt?: number };
    pictionary?: { 
      score: number; 
      completedAt?: number;
      roundsDrawn?: number; // number of rounds this player has drawn
      roundsGuessed?: number; // number of rounds this player has guessed correctly
    };
  };
  totalMiniGameScore?: number;
  // Overall scoring (meta layer)
  overallPoints?: number;
}

export interface TriviaQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EmojiClue {
  id: string;
  emoji: string; // e.g. "👦🏠🎄😱🧔🧔"
  category: 'movie' | 'song';
  correct: {
    en: string;
    cs: string;
  };
  options: {
    en: string[];
    cs: string[];
  }; // 4 options including the correct one
}

export interface CodePuzzle {
  id: string;
  prompt: { en: string; cs: string };
  hint?: { en: string; cs: string };
  code: string; // 4 digits
}

export interface Riddle {
  id: string;
  prompt: { en: string; cs: string };
  answers: {
    en: string[]; // accepted normalized answers
    cs: string[];
  };
  hint?: { en: string; cs: string };
  additionalClue?: { en: string; cs: string }; // Shown after 3 failed attempts
  secondHint?: { en: string; cs: string }; // Shown after 6 failed attempts
}

export interface PhotoPrompt {
  id: string;
  prompt: { en: string; cs: string };
}

export interface RaceStageDefinition {
  id: string;
  type: RaceStageType;
  title: { en: string; cs: string };
  description: { en: string; cs: string };
  rules: { en: string; cs: string };
  scoring: { en: string; cs: string };
  content: Record<string, any>;
}

export interface RaceTrack {
  id: 'christmas_race_v1';
  title: { en: string; cs: string };
  stages: RaceStageDefinition[];
}

export interface RoomEvent {
  id: string;
  type: RaceEventType;
  playerName: string;
  stageTitle?: string;
  createdAt: number; // ms since epoch
}

// Mini game types
export interface MiniGameTriviaProgress {
  answers: number[]; // Array of selected indices (null = skipped)
  score: number;
  completedAt?: number;
}

export interface MiniGameEmojiProgress {
  answers: string[]; // Array of answer strings
  score: number;
  completedAt?: number;
}

export interface MiniGameWYRProgress {
  choices: ('A' | 'B')[]; // Array of choices
  score: number;
  completedAt?: number;
}

export interface MiniGamePictionaryProgress {
  drawings: Array<{ promptId: string; dataUrl?: string }>;
  score: number;
  completedAt?: number;
}

// Tradition Wheel
export interface TraditionItem {
  id: string;
  en: string;
  cs: string;
}

export interface TraditionWheel {
  id: string;
  name: string;
  traditions: TraditionItem[];
  usedIds: string[];
  lastSpunAt?: number; // ms since epoch
  createdAt: number; // ms since epoch
  controllerUid: string;
}
