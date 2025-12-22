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
export type MiniGameType = 'trivia' | 'emoji' | 'wyr' | 'pictionary' | 'guess_the_song' | 'family_feud' | 'bingo';

export type SessionStatus = 'lobby' | 'intro' | 'team_setup' | 'in_game' | 'in_round' | 'steal' | 'round_reveal' | 'reveal' | 'between' | 'finished' | 'claiming';
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
  // Bingo-specific
  drawnBalls?: string[]; // Array of drawn ball strings (e.g., "B-12")
  bingoWinnerUid?: string; // UID of the winner when bingo is claimed
  // Multi-winner bingo support (optional; kept flexible for backward compatibility)
  bingoWinners?: string[]; // ordered list: [1st, 2nd, 3rd]
  bingoMode?: 'first' | 'top3'; // default: 'first'
  bingoLastWinnerUid?: string; // latest claimer (for TV celebration)
  startedAt?: number; // ms since epoch - when the game started
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
    bingo?: { selectedIds: string[] }; // Not used for bingo, but kept for consistency
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
  // Night Scoreboard: persistent aggregation across all sessions in this room
  scoreboard?: RoomScoreboard;
  // Identity mapping: uid -> playerIdentityId (for reconnect support)
  identityMap?: Record<string, string>; // uid -> playerIdentityId
  // Multi-family event support
  eventId?: string; // Event this room belongs to
  groupId?: string; // Family group this room belongs to
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
  // Identity fields (UID is primary identity)
  displayName: string; // Original name input (can be edited, can be duplicated)
  displayNameNormalized?: string; // Lowercased, trimmed for uniqueness logic
  displayTag?: string; // e.g. "(2)" appended for duplicates or emoji tag
  // Stable identity for reconnect (defaults to uid if no reconnect)
  playerIdentityId?: string; // Used for scoreboard aggregation across device switches
  // Reconnect code (optional)
  playerKey?: string; // 4-digit PIN or 3 emoji code
  playerKeyType?: 'pin' | 'emoji';
  
  // Legacy name field (for backward compatibility)
  name: string; // Deprecated: use displayName + displayTag for rendering
  
  avatar: string;
  score: number;
  joinedAt: number; // ms since epoch
  lastSeenAt?: number; // ms since epoch (updated on activity)
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
    bingo?: { score: number; completedAt?: number };
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

// Bingo card structure
export interface BingoCard {
  // Firestore cannot store nested arrays, so the persisted shape is flat.
  // Keep legacy fields optional for local/in-memory compatibility.
  version?: 2;
  size?: 5;
  cells?: Array<string | 'FREE'>; // length 25
  marked?: boolean[]; // length 25
  // Legacy (should not be written to Firestore as nested arrays)
  grid?: (string | 'FREE')[][];
  markedGrid?: boolean[][];
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

// Multi-Family Event System Types

export type EventStatus = 'lobby' | 'live' | 'ended';

export interface Event {
  eventId: string; // Human-friendly code like "XMAS-7H2K" (also serves as join code)
  title: string;
  createdAt: number; // ms since epoch
  status: EventStatus;
  defaultLang: 'en' | 'cs';
  timezone: string; // e.g. "Europe/Amsterdam"
  createdByDeviceId: string; // No auth required for creation
  individualLeaderboardEnabled?: boolean; // Opt-in for event-wide individual leaderboard
  // If this event was created automatically for a hosted room, link it here.
  primaryRoomId?: string;
}

export interface EventGroup {
  groupId: string; // e.g. "GRP-A1B2"
  displayName: string; // e.g. "The Pretorius Family"
  createdAt: number; // ms since epoch
  joinCode?: string; // Short code per group, optional
  createdByDeviceId: string;
  currentRoomId?: string; // The active room used by the family
}

export interface PlayerIdentity {
  identityId: string; // Stable player identity within this family
  groupId: string;
  displayName: string;
  avatar: string;
  createdAt: number; // ms since epoch
  lastSeenAt: number; // ms since epoch
  reconnectCode?: string; // PIN or emoji code for reclaiming identity
}

export interface EventMembership {
  uid: string; // Firebase Auth UID (anonymous)
  eventId: string;
  groupId: string;
  joinedAt: number; // ms since epoch
}

export interface EventScoreboard {
  updatedAt: number; // ms since epoch
  families: Record<string, EventScoreboardFamily>;
  individuals?: Record<string, EventScoreboardIndividual>;
  processedRoomSessions: Record<string, boolean>; // Key: "${roomId}_${sessionId}"
}

export interface EventScoreboardFamily {
  groupId: string;
  displayName: string;
  totalPoints: number;
  wins: number;
  gamesPlayed: number;
  lastUpdatedAt: number; // ms since epoch
}

export interface EventScoreboardIndividual {
  identityId: string;
  groupId: string;
  displayName: string;
  totalPoints: number;
  wins: number;
}

export interface GroupHistory {
  eventId: string;
  title: string;
  dateIso: string; // ISO date string
  totalPoints: number;
  rank?: number; // Final rank in the event
  breakdownByGame: Record<string, number>;
  createdAt: number; // ms since epoch
}

export interface PlayerHistory {
  eventId: string;
  totalPoints: number;
  wins: number;
  gamesPlayed: number;
  breakdownByGame: Record<string, number>;
  createdAt: number; // ms since epoch
}

// Night Scoreboard: room-level aggregation across all sessions
export interface RoomScoreboard {
  players: Record<string, ScoreboardPlayer>; // keyed by playerIdentityId
  sessionHistory: Array<{
    sessionId: string;
    gameId: string;
    endedAt: number; // ms since epoch
    winners: string[]; // playerIdentityIds
    pointsAwarded: Record<string, number>; // playerIdentityId -> points
  }>;
  processedSessions?: string[]; // sessionIds that have been processed (for idempotency) - stored as array in Firestore
}

export interface ScoreboardPlayer {
  playerIdentityId: string; // stable identity key
  uid: string; // current uid (may change on reconnect)
  displayName: string;
  displayTag?: string;
  avatar: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  lastUpdatedAt: number; // ms since epoch
  breakdown: {
    amazing_race?: number;
    trivia?: number;
    emoji?: number;
    wyr?: number;
    pictionary?: number;
    guess_the_song?: number;
    family_feud?: number;
    bingo?: number;
  };
}

// Session Finalization Contract
export interface SessionFinalization {
  sessionId: string;
  gameId: string;
  endedAt: number; // ms since epoch
  pointsAwarded: Record<string, number>; // playerIdentityId -> points in this session
  winners: string[]; // playerIdentityIds
  participants: string[]; // playerIdentityIds who actively participated
}
