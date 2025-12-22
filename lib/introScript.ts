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
  guess_the_song: [
    {
      en: 'Listen closely. Guess the Christmas song before the reveal.',
      cs: 'Dobře poslouchejte. Uhodněte vánoční písničku.',
    },
    {
      en: 'Audio plays on TV. Lock in your answer on your phone.',
      cs: 'Zvuk hraje na TV. Zamkni odpověď na telefonu.',
    },
  ],
  family_feud: [
    {
      en: 'We asked 100 people… Christmas answers are on the board.',
      cs: 'Zeptali jsme se lidí… Vánoční odpovědi jsou na tabuli.',
    },
    {
      en: 'Two teams compete. Guess answers to reveal them. Three strikes and the other team can steal!',
      cs: 'Dva týmy soupeří. Hádejte odpovědi, abyste je odhalili. Tři chyby a druhý tým může ukrást!',
    },
  ],
  bingo: [
    {
      en: 'Eyes on your card. The balls are about to roll.',
      cs: 'Sledujte své bingo. Koule se začínají točit.',
    },
    {
      en: 'Mark numbers as they\'re called. First to complete a line wins!',
      cs: 'Označujte čísla, jak jsou volána. První, kdo dokončí řadu, vyhrává!',
    },
  ],
};


