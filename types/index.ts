export type RoomStatus = 'lobby' | 'running' | 'finished';

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
  maxPlayers: number;
  createdAt: number; // ms since epoch
  controllerUid: string;
  status: RoomStatus;
  raceTrackId: 'christmas_race_v1';
  raceStartedAt?: number; // ms since epoch
  settings: {
    difficulty: 'easy' | 'medium' | 'hard';
    allowSkips: boolean;
  };
  eventsEnabled: boolean;
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
