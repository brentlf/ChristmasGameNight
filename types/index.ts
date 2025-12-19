// Room-level lifecycle. Historically this app used: lobby -> running -> finished.
// We extend it to support TV-led session flows without breaking old rooms.
export type RoomStatus =
  | 'lobby'
  | 'running'
  | 'finished'
  | 'between_sessions'
  | 'session_intro'
  | 'session_in_game'
  | 'session_reveal'
  | 'session_results';
export type RoomMode = 'amazing_race' | 'mini_games' | 'leaderboard';
export type MiniGameType = 'trivia' | 'emoji' | 'wyr' | 'pictionary' | 'guess_the_song' | 'family_feud';

export type SessionStatus = 'lobby' | 'intro' | 'team_setup' | 'in_game' | 'in_round' | 'steal' | 'round_reveal' | 'reveal' | 'between' | 'finished';
export type SessionGameId = MiniGameType | 'race';

export interface RoomCurrentSession {
  sessionId: string;
  status: SessionStatus;
  gameId?: SessionGameId;
  questionIndex?: number;
  // Stored as ms since epoch (consistent with rest of this codebase).
  questionStartedAt?: number;
  questionEndsAt?: number;
  // Active players snapshot for this session. Can be expanded during the session if late-joiners answer.
  activePlayerUids?: string[];
  // Convenience cache for UI; TV/controller may populate but clients can also derive from answers.
  answeredUids?: string[];
  // Game-specific reveal payload (shape depends on gameId)
  revealData?: Record<string, any> | null;
  // Pictionary-specific
  drawerUid?: string | null;
  // Family Feud-specific
  roundIndex?: number;
  activeTeam?: 'A' | 'B';
  strikes?: number;
  revealedAnswerIds?: string[];
  teamScores?: {
    A: number;
    B: number;
  };
  teamMapping?: Record<string, 'A' | 'B'>; // uid -> team
}

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
  // Optional redirect to a new room (room rollover without rescanning).
  redirectRoomId?: string;
  // TV-led synchronous mini-game session (one room -> many sessions).
  currentSession?: RoomCurrentSession;
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
    guess_the_song?: { selectedIds: string[] };
    family_feud?: { selectedIds: string[] };
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
  // AI-enhanced mode: generate content dynamically using AI instead of static pools
  aiEnhanced?: boolean;
  // Race AI-enhanced mode flag
  raceAiEnhanced?: boolean;
  // Race AI theme (defaults to 'Christmas' if not specified)
  raceAiTheme?: string;
  // Race AI difficulty (defaults to 'easy' if not specified)
  raceAiDifficulty?: 'easy' | 'medium' | 'hard';
  // Race stage questions (stored per stage to ensure all players see same questions)
  // For AI-enhanced mode, this also contains the full content objects (riddles, questions, clues)
  raceStageQuestions?: Record<string, {
    riddleId?: string;
    clueIds?: string[];
    questionIds?: string[];
    puzzleId?: string;
    promptId?: string;
    // AI-generated content (full objects stored here)
    riddle?: any;
    questions?: any[];
    clues?: any[];
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
  // Mini-games lobby readiness (used to determine active players at session start).
  ready?: boolean;
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
    guess_the_song?: { answers: number[]; score: number; completedAt?: number };
    family_feud?: { score: number; completedAt?: number };
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
