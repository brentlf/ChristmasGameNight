import type { SessionGameId } from '@/types';

export type IntroLine = { en: string; cs: string };

export const INTRO_SCRIPT: Record<Exclude<SessionGameId, 'race'>, IntroLine[]> = {
  trivia: [
    {
      en: '10 questions. Answer on your phone.',
      cs: '10 otázek. Odpovídej na telefonu.',
    },
    {
      en: 'We reveal when everyone locks in (or time runs out).',
      cs: 'Odhalíme, až všichni zamknou odpověď (nebo vyprší čas).',
    },
  ],
  emoji: [
    {
      en: 'Guess the movie or song from emojis.',
      cs: 'Uhodni film nebo píseň podle emotikonů.',
    },
    {
      en: 'Lock in your answer. Reveal happens together.',
      cs: 'Zamkni odpověď. Odhalení uvidí všichni spolu.',
    },
  ],
  wyr: [
    {
      en: 'Choose A or B. No right answers — just chaos.',
      cs: 'Vyber A nebo B. Žádné správně — jen chaos.',
    },
    {
      en: 'Vote fast. We show the split on the TV.',
      cs: 'Hlasuj rychle. Na TV ukážeme rozdělení hlasů.',
    },
  ],
  pictionary: [
    {
      en: 'One draws, everyone guesses.',
      cs: 'Jeden kreslí, ostatní hádají.',
    },
    {
      en: 'Fast fingers, sharp eyes. First correct scores big.',
      cs: 'Rychlé prsty, ostré oči. První správný bere víc.',
    },
  ],
};


