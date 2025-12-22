export type AudioDevice = 'tv' | 'phone';

export type AudioGroup = 'music' | 'sfx';

export type AudioEventName =
  | 'ui.click'
  | 'ui.hover_soft'
  | 'ui.lock_in'
  | 'ui.transition'
  | 'ui.error'
  | 'ui.success'
  | 'game.correct'
  | 'game.wrong'
  | 'game.reveal'
  | 'game.round_win'
  | 'game.game_win'
  | 'game.countdown_tick'
  | 'bingo.spin'
  | 'bingo.ball_pop'
  | 'bingo.bingo'
  | 'race.checkpoint'
  | 'race.finish'
  | 'feud.strike'
  | 'feud.reveal'
  | 'feud.steal';

export type LegacySoundName =
  | 'click'
  | 'success'
  | 'ding'
  | 'jingle'
  | 'pageTurn'
  | 'whoosh'
  | 'bell'
  | 'cheer'
  | 'sleighbells'
  | 'hohoho';

export type AudioEventDef = {
  group: AudioGroup;
  /**
   * Preferred path(s). We try in order and use the first that exists.
   * Put newer structure first, older fallbacks later.
   */
  src: string[];
  /**
   * Cooldown per event to prevent spam.
   */
  cooldownMs?: number;
  /**
   * Base multiplier applied after user volume (per group) and device multiplier.
   */
  gain?: number;
  /**
   * Which devices are allowed to play this event.
   * If omitted, allowed on both.
   */
  allow?: AudioDevice[];
  /**
   * Optional flag: if true, this is TV-only by default unless user enables it.
   */
  tvOptional?: boolean;
};

export const AUDIO_EVENT_MAP: Record<AudioEventName, AudioEventDef> = {
  // UI-level events (subtle)
  'ui.click': {
    group: 'sfx',
    src: ['/audio/ui/click.mp3', '/audio/ui/click.wav', '/audio/click.ogg', '/audio/bell.ogg'],
    cooldownMs: 150,
    gain: 0.9,
    // RULE: TV should not click for every *player controller* action.
    // We enforce that by only auto-attaching global click sounds on phones.
    // Explicit TV UI clicks (host navigation) can still use this.
    allow: ['tv', 'phone'],
  },
  'ui.hover_soft': {
    group: 'sfx',
    // Optional: if you add it, it will be used. Otherwise we fall back quietly.
    src: ['/audio/ui/hover_soft.mp3', '/audio/ui/hover_soft.wav', '/audio/pageTurn.ogg', '/audio/snowstep.ogg'],
    cooldownMs: 250,
    gain: 0.35,
    allow: ['phone'],
  },
  'ui.lock_in': {
    group: 'sfx',
    src: ['/audio/ui/lock_in.mp3', '/audio/ui/lock_in.wav', '/audio/ding.ogg'],
    cooldownMs: 350,
    gain: 0.95,
    allow: ['phone'],
  },
  'ui.transition': {
    group: 'sfx',
    src: ['/audio/ui/swipe_whoosh.mp3', '/audio/ui/swipe_whoosh.wav', '/audio/whoosh.ogg'],
    cooldownMs: 500,
    gain: 0.85,
    allow: ['tv', 'phone'],
  },
  'ui.error': {
    group: 'sfx',
    // Avoid 404 spam by only listing files that exist in /public/audio.
    // Keep this *soft* (UI errors happen a lot and shouldn't sound like a game show buzzer).
    src: ['/audio/game/wrong_soft.ogg', '/audio/ding.ogg', '/audio/game/wrong_buzz.mp3'],
    cooldownMs: 500,
    gain: 0.35,
    allow: ['tv', 'phone'],
  },
  'ui.success': {
    group: 'sfx',
    // Avoid 404 spam by only listing files that exist in /public/audio.
    src: ['/audio/game/reveal_sparkle.mp3', '/audio/success.ogg'],
    cooldownMs: 350,
    gain: 0.75,
    allow: ['tv', 'phone'],
  },

  // Game-level events (meaningful)
  'game.correct': {
    group: 'sfx',
    src: ['/audio/game/correct_chime.mp3', '/audio/game/correct_chime.wav', '/audio/success.ogg'],
    cooldownMs: 500,
    gain: 1,
    allow: ['tv', 'phone'],
  },
  'game.wrong': {
    group: 'sfx',
    src: ['/audio/game/wrong_soft.ogg', '/audio/game/wrong_buzz.mp3', '/audio/game/wrong_buzz.wav', '/audio/ding.ogg'],
    cooldownMs: 500,
    gain: 0.9,
    allow: ['tv', 'phone'],
  },
  'game.reveal': {
    group: 'sfx',
    src: ['/audio/game/reveal_sparkle.mp3', '/audio/game/reveal_sparkle.wav', '/audio/success.ogg'],
    cooldownMs: 450,
    gain: 0.9,
    allow: ['tv', 'phone'],
  },
  'game.round_win': {
    group: 'sfx',
    src: ['/audio/game/trophy.mp3', '/audio/game/trophy.wav', '/audio/game/round_win.mp3', '/audio/game/round_win.wav', '/audio/sleighbells.mp3', '/audio/cheer.ogg'],
    cooldownMs: 1200,
    gain: 1,
    allow: ['tv', 'phone'],
  },
  'game.game_win': {
    group: 'sfx',
    src: ['/audio/game/confetti.mp3', '/audio/game/confetti.wav', '/audio/game/trophy.mp3', '/audio/game/trophy.wav', '/audio/cheer.ogg'],
    cooldownMs: 2000,
    gain: 1,
    allow: ['tv', 'phone'],
  },
  'game.countdown_tick': {
    group: 'sfx',
    src: ['/audio/game/countdown_tick.mp3', '/audio/game/countdown_tick.wav', '/audio/ding.ogg'],
    cooldownMs: 120,
    gain: 0.35,
    allow: ['tv'],
    tvOptional: true,
  },

  // Bingo-specific
  'bingo.spin': {
    group: 'sfx',
    src: ['/audio/bingo/drum_spin.mp3', '/audio/bingo/drum_spin.wav', '/audio/jingle.ogg'],
    cooldownMs: 900,
    gain: 0.8,
    allow: ['tv', 'phone'],
  },
  'bingo.ball_pop': {
    group: 'sfx',
    src: ['/audio/bingo/ball_pop.mp3', '/audio/bingo/ball_pop.wav', '/audio/ding.ogg'],
    cooldownMs: 250,
    gain: 0.9,
    allow: ['tv', 'phone'],
  },
  'bingo.bingo': {
    group: 'sfx',
    src: ['/audio/bingo/Bingo.mp3', '/audio/bingo/Bingo.wav', '/audio/game/trophy.mp3', '/audio/cheer.ogg'],
    cooldownMs: 2000,
    gain: 1.0,
    allow: ['tv', 'phone'],
  },

  // Amazing Race
  'race.checkpoint': {
    group: 'sfx',
    src: ['/audio/race/checkpoint.mp3', '/audio/race/checkpoint.wav', '/audio/ding.ogg'],
    cooldownMs: 500,
    gain: 0.85,
    allow: ['tv', 'phone'],
  },
  'race.finish': {
    group: 'sfx',
    src: ['/audio/race/finish_fanfare_soft.mp3', '/audio/race/finish_fanfare_soft.wav', '/audio/cheer.ogg'],
    cooldownMs: 1500,
    gain: 1,
    allow: ['tv', 'phone'],
  },

  // Family Feud
  'feud.strike': {
    group: 'sfx',
    src: ['/audio/game/wrong_buzz.mp3', '/audio/game/wrong_buzz.wav', '/audio/ding.ogg'],
    cooldownMs: 650,
    gain: 1,
    allow: ['tv', 'phone'],
  },
  'feud.reveal': {
    group: 'sfx',
    src: ['/audio/game/reveal_sparkle.mp3', '/audio/game/reveal_sparkle.wav', '/audio/success.ogg'],
    cooldownMs: 450,
    gain: 0.9,
    allow: ['tv', 'phone'],
  },
  'feud.steal': {
    group: 'sfx',
    src: ['/audio/game/trophy.mp3', '/audio/game/trophy.wav', '/audio/sleighbells.mp3', '/audio/cheer.ogg'],
    cooldownMs: 1500,
    gain: 1,
    allow: ['tv', 'phone'],
  },
};

export const BACKGROUND_MUSIC_SOURCES = ['/audio/music/christmas_ambient.mp3', '/audio/christmas-ambient.ogg'];

export function legacyToEvent(name: string): AudioEventName | null {
  const n = name as LegacySoundName;
  switch (n) {
    case 'click':
      return 'ui.click';
    case 'whoosh':
    case 'pageTurn':
      return 'ui.transition';
    case 'success':
      return 'ui.success';
    case 'ding':
      return 'game.reveal';
    case 'jingle':
      return 'bingo.spin';
    case 'cheer':
      return 'game.game_win';
    case 'sleighbells':
      return 'game.round_win';
    case 'hohoho':
      return 'game.game_win';
    case 'bell':
      return 'ui.click';
    default:
      return null;
  }
}


