import type { CodePuzzle, EmojiClue, PhotoPrompt, RaceTrack, Riddle, TriviaQuestion } from '@/types';

export const riddleGatePool: Riddle[] = [
  {
    id: 'rg_1',
    prompt: {
      en: "I’m not a gift, but I’m wrapped. I’m not a tree, but I’m topped. What am I?",
      cs: 'Nejsem dárek, ale bývám zabalený. Nejsem stromek, ale mívám špičku. Co jsem?',
    },
    // Answer: a Christmas cracker ("bonbon" in CZ context).
    answers: { en: ['christmas cracker', 'cracker'], cs: ['vánoční bonbon', 'bonbon'] },
    hint: { en: 'Pull me open and I pop!', cs: 'Zatáhni za konce a “prásknu”!' },
  },
  {
    id: 'rg_2',
    prompt: {
      en: 'I go up but never come down, and I show you how old you are. What am I?',
      cs: 'Jdu nahoru, ale nikdy dolů. Řeknu ti, kolik ti je. Co jsem?',
    },
    answers: { en: ['age'], cs: ['věk'] },
    hint: { en: 'You gain one every year.', cs: 'Každý rok přibude jeden.' },
  },
  {
    id: 'rg_3',
    prompt: {
      en: 'I’m full of holes, but I still hold water. What am I?',
      cs: 'Jsem plný děr, ale přesto držím vodu. Co jsem?',
    },
    answers: { en: ['sponge', 'a sponge'], cs: ['houba', 'mycí houba'] },
    hint: { en: 'Kitchen hero.', cs: 'Kuchyňský hrdina.' },
  },
  {
    id: 'rg_4',
    prompt: {
      en: 'What has many keys but can’t open a single lock?',
      cs: 'Co má spoustu kláves, ale neotevře žádný zámek?',
    },
    answers: { en: ['piano', 'a piano', 'keyboard'], cs: ['piano', 'klavír', 'klávesnice'] },
    hint: { en: 'It makes music.', cs: 'Dělá hudbu.' },
  },
  {
    id: 'rg_5',
    prompt: {
      en: 'The more you take, the more you leave behind. What are they?',
      cs: 'Čím víc bereš, tím víc necháváš za sebou. Co to je?',
    },
    answers: { en: ['footsteps', 'steps'], cs: ['stopy', 'kroky'] },
    hint: { en: 'Think: walking.', cs: 'Přemýšlej: chůze.' },
  },
  {
    id: 'rg_6',
    prompt: {
      en: 'I can be cracked, made, told, and played. What am I?',
      cs: 'Dá se rozlousknout, udělat, říct i zahrát. Co jsem?',
    },
    answers: { en: ['joke', 'a joke'], cs: ['vtip'] },
    hint: { en: 'You might laugh.', cs: 'Možná se zasměješ.' },
  },
];

export const finalRiddlePool: Riddle[] = [
  {
    id: 'fr_1',
    prompt: {
      en: 'I have a carrot nose, I wear a hat, and I melt if it gets warm. What am I?',
      cs: 'Mám mrkvový nos, nosím klobouk a když je teplo, roztaju. Co jsem?',
    },
    answers: { en: ['snowman'], cs: ['sněhulák'] },
    hint: { en: 'Frosty says hi.', cs: 'Frosty zdraví.' },
  },
  {
    id: 'fr_2',
    prompt: {
      en: 'What do you call Santa when he takes a break?',
      cs: 'Jak se říká Santovi, když si dá pauzu?',
    },
    answers: { en: ['santa pause', 'a santa pause'], cs: ['santa pauza', 'santa pause'] },
    hint: { en: 'It’s a pun.', cs: 'Je to slovní hříčka.' },
  },
  {
    id: 'fr_3',
    prompt: {
      en: 'I’m the thing you hang, but I’m not on the wall. I’m full, but I’m not a cup. What am I?',
      cs: 'Jsem věc, kterou věšíš, ale ne na zeď. Jsem plná, ale nejsem hrnek. Co jsem?',
    },
    answers: { en: ['stocking', 'christmas stocking'], cs: ['punčocha', 'vánoční punčocha'] },
    hint: { en: 'By the fireplace.', cs: 'U krbu.' },
  },
  {
    id: 'fr_4',
    prompt: {
      en: 'What do snowmen eat for breakfast?',
      cs: 'Co jedí sněhuláci k snídani?',
    },
    answers: { en: ['frosted flakes', 'cornflakes', 'flakes'], cs: ['frosties', 'kukuřičné lupínky', 'lupínky'] },
    hint: { en: 'A cereal with “frost”.', cs: 'Cereálie s “mrazem”.' },
  },
];

export const emojiClues: EmojiClue[] = [
  {
    id: 'e_01',
    emoji: '👦🏠🎄😱🧔🧔',
    category: 'movie',
    correct: { en: 'Home Alone', cs: 'Sám doma' },
    options: {
      en: ['Home Alone', 'Elf', 'The Grinch', 'The Santa Clause'],
      cs: ['Sám doma', 'Elf', 'Grinch', 'Santa Claus'],
    },
  },
  {
    id: 'e_02',
    emoji: '🚂❄️🎄🎅',
    category: 'movie',
    correct: { en: 'The Polar Express', cs: 'Polární expres' },
    options: {
      en: ['The Polar Express', 'Frozen', 'A Christmas Carol', 'Love Actually'],
      cs: ['Polární expres', 'Ledové království', 'Vánoční koleda', 'Láska nebeská'],
    },
  },
  {
    id: 'e_03',
    emoji: '👹🎄🎁',
    category: 'movie',
    correct: { en: 'The Grinch', cs: 'Grinch' },
    options: {
      en: ['The Grinch', 'Krampus', 'Elf', 'Home Alone'],
      cs: ['Grinch', 'Krampus', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'e_04',
    emoji: '👨‍👩‍👧‍👦💔🎄🎁',
    category: 'movie',
    correct: { en: 'Four Christmases', cs: 'Čtyři Vánoce' },
    options: {
      en: ['Four Christmases', 'The Holiday', 'Love Actually', 'Elf'],
      cs: ['Čtyři Vánoce', 'Prázdniny', 'Láska nebeská', 'Elf'],
    },
  },
  {
    id: 'e_05',
    emoji: '🎅🧍‍♂️👔🗽🎄',
    category: 'movie',
    correct: { en: 'Elf', cs: 'Elf' },
    options: {
      en: ['Elf', 'The Santa Clause', 'Miracle on 34th Street', 'Home Alone 2'],
      cs: ['Elf', 'Santa Claus', 'Zázrak na 34. ulici', 'Sám doma 2'],
    },
  },
  {
    id: 'e_06',
    emoji: '💌❤️🎄',
    category: 'movie',
    correct: { en: 'Love Actually', cs: 'Láska nebeská' },
    options: {
      en: ['Love Actually', 'The Holiday', 'Notting Hill', 'Bridget Jones'],
      cs: ['Láska nebeská', 'Prázdniny', 'Notting Hill', 'Bridget Jonesová'],
    },
  },
  {
    id: 'e_07',
    emoji: '🔔🔔🔔',
    category: 'song',
    correct: { en: 'Jingle Bells', cs: 'Rolničky' },
    options: {
      en: ['Jingle Bells', 'Silent Night', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Rolničky', 'Tichá noc', 'Ozdobte sály', 'Přejeme vám veselé Vánoce'],
    },
  },
  {
    id: 'e_08',
    emoji: '🤫🌙⭐️',
    category: 'song',
    correct: { en: 'Silent Night', cs: 'Tichá noc' },
    options: {
      en: ['Silent Night', 'Jingle Bells', 'Feliz Navidad', 'Let It Snow'],
      cs: ['Tichá noc', 'Rolničky', 'Feliz Navidad', 'Let It Snow'],
    },
  },
  {
    id: 'e_09',
    emoji: '❄️❄️❄️🙋‍♂️',
    category: 'song',
    correct: { en: 'Let It Snow', cs: 'Let It Snow' },
    options: {
      en: ['Let It Snow', 'White Christmas', 'Winter Wonderland', 'Jingle Bell Rock'],
      cs: ['Let It Snow', 'Bílé Vánoce', 'Winter Wonderland', 'Jingle Bell Rock'],
    },
  },
  {
    id: 'e_10',
    emoji: '🎄🏡🕯️',
    category: 'song',
    correct: { en: 'Deck the Halls', cs: 'Ozdobte sály' },
    options: {
      en: ['Deck the Halls', 'Silent Night', 'Jingle Bells', 'Carol of the Bells'],
      cs: ['Ozdobte sály', 'Tichá noc', 'Rolničky', 'Carol of the Bells'],
    },
  },
  {
    id: 'e_11',
    emoji: '🎅🎸🪨',
    category: 'song',
    correct: { en: 'Jingle Bell Rock', cs: 'Jingle Bell Rock' },
    options: {
      en: ['Jingle Bell Rock', 'Let It Snow', 'Rockin’ Around the Christmas Tree', 'Feliz Navidad'],
      cs: ['Jingle Bell Rock', 'Let It Snow', 'Rockin’ Around the Christmas Tree', 'Feliz Navidad'],
    },
  },
  {
    id: 'e_12',
    emoji: '🪅🎄🇲🇽',
    category: 'song',
    correct: { en: 'Feliz Navidad', cs: 'Feliz Navidad' },
    options: {
      en: ['Feliz Navidad', 'Jingle Bells', 'Silent Night', 'White Christmas'],
      cs: ['Feliz Navidad', 'Rolničky', 'Tichá noc', 'Bílé Vánoce'],
    },
  },
  {
    id: 'e_13',
    emoji: '🎄🕺🔁',
    category: 'song',
    correct: { en: 'Rockin’ Around the Christmas Tree', cs: 'Rockin’ Around the Christmas Tree' },
    options: {
      en: ['Rockin’ Around the Christmas Tree', 'Jingle Bell Rock', 'Deck the Halls', 'Let It Snow'],
      cs: ['Rockin’ Around the Christmas Tree', 'Jingle Bell Rock', 'Ozdobte sály', 'Let It Snow'],
    },
  },
  {
    id: 'e_14',
    emoji: '☃️🏰❄️🎶',
    category: 'movie',
    correct: { en: 'Frozen', cs: 'Ledové království' },
    options: {
      en: ['Frozen', 'The Polar Express', 'Jack Frost', 'Home Alone'],
      cs: ['Ledové království', 'Polární expres', 'Jack Frost', 'Sám doma'],
    },
  },
  {
    id: 'e_15',
    emoji: '🎁💍🎄',
    category: 'movie',
    correct: { en: 'The Holiday', cs: 'Prázdniny' },
    options: {
      en: ['The Holiday', 'Love Actually', 'Four Christmases', 'Elf'],
      cs: ['Prázdniny', 'Láska nebeská', 'Čtyři Vánoce', 'Elf'],
    },
  },
  {
    id: 'e_16',
    emoji: '🎅👨‍⚖️📜',
    category: 'movie',
    correct: { en: 'The Santa Clause', cs: 'Santa Claus' },
    options: {
      en: ['The Santa Clause', 'Elf', 'Miracle on 34th Street', 'The Grinch'],
      cs: ['Santa Claus', 'Elf', 'Zázrak na 34. ulici', 'Grinch'],
    },
  },
  {
    id: 'e_17',
    emoji: '🎄🚗💥😵',
    category: 'movie',
    correct: { en: "National Lampoon's Christmas Vacation", cs: 'Vánoční prázdniny' },
    options: {
      en: ["National Lampoon's Christmas Vacation", 'Home Alone', 'Elf', 'The Holiday'],
      cs: ['Vánoční prázdniny', 'Sám doma', 'Elf', 'Prázdniny'],
    },
  },
  {
    id: 'e_18',
    emoji: '🎄👶⭐️',
    category: 'song',
    correct: { en: 'Away in a Manger', cs: 'Spinkej, děťátko' },
    options: {
      en: ['Away in a Manger', 'Silent Night', 'Jingle Bells', 'O Come All Ye Faithful'],
      cs: ['Spinkej, děťátko', 'Tichá noc', 'Rolničky', 'Ó, pojďme všichni'],
    },
  },
  {
    id: 'e_19',
    emoji: '👼🔔🔔🔔',
    category: 'song',
    correct: { en: 'Carol of the Bells', cs: 'Carol of the Bells' },
    options: {
      en: ['Carol of the Bells', 'Jingle Bells', 'Deck the Halls', 'Let It Snow'],
      cs: ['Carol of the Bells', 'Rolničky', 'Ozdobte sály', 'Let It Snow'],
    },
  },
  {
    id: 'e_20',
    emoji: '🎄🤍🎶',
    category: 'song',
    correct: { en: 'White Christmas', cs: 'Bílé Vánoce' },
    options: {
      en: ['White Christmas', 'Let It Snow', 'Silent Night', 'Feliz Navidad'],
      cs: ['Bílé Vánoce', 'Let It Snow', 'Tichá noc', 'Feliz Navidad'],
    },
  },
];

export const triviaPool: TriviaQuestion[] = [
  // 30 light Christmas trivia questions (EN/CS localized in prompts/options)
  { id: 't01', prompt: 'What is the name of the main character in “A Christmas Carol”?', options: ['Ebenezer Scrooge', 'Tiny Tim', 'Bob Cratchit', 'Jack Frost'], correctIndex: 0, difficulty: 'easy' },
  { id: 't02', prompt: 'Which country is often credited with popularizing the Christmas tree?', options: ['Germany', 'Italy', 'Canada', 'Spain'], correctIndex: 0, difficulty: 'easy' },
  { id: 't03', prompt: 'What do people traditionally hang on a Christmas tree?', options: ['Ornaments', 'Shoes', 'Spoons', 'Books'], correctIndex: 0, difficulty: 'easy' },
  { id: 't04', prompt: 'What is the Grinch’s dog called?', options: ['Max', 'Buddy', 'Rex', 'Charlie'], correctIndex: 0, difficulty: 'easy' },
  { id: 't05', prompt: 'In the song “Jingle Bells”, what do the bells do?', options: ['Ring', 'Fly', 'Whistle', 'Sleep'], correctIndex: 0, difficulty: 'easy' },
  { id: 't06', prompt: 'Which color is traditionally linked to Christmas?', options: ['Red and green', 'Purple and orange', 'Pink and blue', 'Black and white'], correctIndex: 0, difficulty: 'easy' },
  { id: 't07', prompt: 'What do you usually put at the top of the Christmas tree?', options: ['Star', 'Pumpkin', 'Apple', 'Candle'], correctIndex: 0, difficulty: 'easy' },
  { id: 't08', prompt: 'Which reindeer is famous for a red nose?', options: ['Rudolph', 'Dasher', 'Comet', 'Cupid'], correctIndex: 0, difficulty: 'easy' },
  { id: 't09', prompt: 'What do you call the night before Christmas?', options: ['Christmas Eve', 'Boxing Day', 'New Year’s Eve', 'Easter Eve'], correctIndex: 0, difficulty: 'easy' },
  { id: 't10', prompt: 'What is a common Christmas drink (non-alcoholic)?', options: ['Hot chocolate', 'Lemonade', 'Iced tea', 'Cola'], correctIndex: 0, difficulty: 'easy' },
  { id: 't11', prompt: 'In “Home Alone”, what is the boy’s name?', options: ['Kevin', 'Tom', 'Harry', 'Peter'], correctIndex: 0, difficulty: 'easy' },
  { id: 't12', prompt: 'What do people kiss under at Christmas?', options: ['Mistletoe', 'Oak tree', 'Palm leaf', 'Sunflower'], correctIndex: 0, difficulty: 'easy' },
  { id: 't13', prompt: 'How many ghosts visit Scrooge (including Marley)?', options: ['4', '3', '2', '5'], correctIndex: 0, difficulty: 'medium' },
  { id: 't14', prompt: 'Which month is Christmas in?', options: ['December', 'November', 'January', 'October'], correctIndex: 0, difficulty: 'easy' },
  { id: 't15', prompt: 'What’s the usual shape of a candy cane?', options: ['Hook', 'Circle', 'Triangle', 'Square'], correctIndex: 0, difficulty: 'easy' },
  { id: 't16', prompt: 'What do you do with wrapping paper?', options: ['Wrap gifts', 'Cook food', 'Plant seeds', 'Fix shoes'], correctIndex: 0, difficulty: 'easy' },
  { id: 't17', prompt: 'What’s the name of Santa’s workshop helpers?', options: ['Elves', 'Giants', 'Wizards', 'Pirates'], correctIndex: 0, difficulty: 'easy' },
  { id: 't18', prompt: 'Which is NOT a common Christmas decoration?', options: ['Beach ball', 'Wreath', 'Lights', 'Garland'], correctIndex: 0, difficulty: 'easy' },
  { id: 't19', prompt: 'Which animal is often shown pulling Santa’s sleigh?', options: ['Reindeer', 'Horses', 'Dogs', 'Camels'], correctIndex: 0, difficulty: 'easy' },
  { id: 't20', prompt: 'Which plant is often associated with Christmas (red leaves)?', options: ['Poinsettia', 'Tulip', 'Rose', 'Sunflower'], correctIndex: 0, difficulty: 'medium' },
  { id: 't21', prompt: 'What do you call a group singing Christmas songs door-to-door?', options: ['Caroling', 'Marching', 'Jogging', 'Fencing'], correctIndex: 0, difficulty: 'medium' },
  { id: 't22', prompt: 'Which is a classic Christmas dessert?', options: ['Gingerbread', 'Sushi', 'Tacos', 'Curry'], correctIndex: 0, difficulty: 'easy' },
  { id: 't23', prompt: 'In “Elf”, what sweet ingredient does Buddy love most?', options: ['Syrup', 'Salt', 'Mustard', 'Pepper'], correctIndex: 0, difficulty: 'easy' },
  { id: 't24', prompt: 'What does “Noël” mean in English?', options: ['Christmas', 'Snow', 'Gift', 'Song'], correctIndex: 0, difficulty: 'hard' },
  { id: 't25', prompt: 'What do you usually send that says “Merry Christmas”?', options: ['Card', 'Invoice', 'Ticket', 'Receipt'], correctIndex: 0, difficulty: 'easy' },
  { id: 't26', prompt: 'What color are traditional Christmas stockings often shown as?', options: ['Red', 'Purple', 'Orange', 'Black'], correctIndex: 0, difficulty: 'easy' },
  { id: 't27', prompt: 'What do you usually put inside a stocking?', options: ['Small gifts/treats', 'Shoes', 'Water', 'Sand'], correctIndex: 0, difficulty: 'easy' },
  { id: 't28', prompt: 'Which of these is a Christmas song?', options: ['Silent Night', 'Happy Birthday', 'Jaws Theme', 'Baby Shark'], correctIndex: 0, difficulty: 'easy' },
  { id: 't29', prompt: 'What do many people build from snow?', options: ['Snowman', 'Sandcastle', 'Boat', 'House'], correctIndex: 0, difficulty: 'easy' },
  { id: 't30', prompt: 'Which is commonly used to decorate a tree (shiny string)?', options: ['Tinsel', 'Tape', 'Rope', 'Wire'], correctIndex: 0, difficulty: 'easy' },
];

/**
 * Czech localization for trivia.
 * We keep the same ids and correctIndex, but translate prompt/options.
 */
export const triviaPoolCs: TriviaQuestion[] = [
  { id: 't01', prompt: 'Jak se jmenuje hlavní postava ve “Vánoční koledě”?', options: ['Ebenezer Scrooge', 'Tiny Tim', 'Bob Cratchit', 'Jack Frost'], correctIndex: 0, difficulty: 'easy' },
  { id: 't02', prompt: 'Která země je často spojována s vánočním stromkem?', options: ['Německo', 'Itálie', 'Kanada', 'Španělsko'], correctIndex: 0, difficulty: 'easy' },
  { id: 't03', prompt: 'Co se tradičně věší na vánoční stromeček?', options: ['Ozdoby', 'Boty', 'Lžíce', 'Knihy'], correctIndex: 0, difficulty: 'easy' },
  { id: 't04', prompt: 'Jak se jmenuje Grinchův pes?', options: ['Max', 'Buddy', 'Rex', 'Charlie'], correctIndex: 0, difficulty: 'easy' },
  { id: 't05', prompt: 'V písni “Rolničky” co rolničky dělají?', options: ['Zvoní', 'Létají', 'Pískají', 'Spí'], correctIndex: 0, difficulty: 'easy' },
  { id: 't06', prompt: 'Které barvy jsou tradičně spojené s Vánoci?', options: ['Červená a zelená', 'Fialová a oranžová', 'Růžová a modrá', 'Černá a bílá'], correctIndex: 0, difficulty: 'easy' },
  { id: 't07', prompt: 'Co se často dává na špičku stromku?', options: ['Hvězda', 'Dýně', 'Jablko', 'Svíčka'], correctIndex: 0, difficulty: 'easy' },
  { id: 't08', prompt: 'Který sob je známý červeným nosem?', options: ['Rudolph', 'Dasher', 'Comet', 'Cupid'], correctIndex: 0, difficulty: 'easy' },
  { id: 't09', prompt: 'Jak se říká noci před Vánoci?', options: ['Štědrý večer', 'Boxing Day', 'Silvestr', 'Velikonoční noc'], correctIndex: 0, difficulty: 'easy' },
  { id: 't10', prompt: 'Jaký je častý vánoční nápoj (nealko)?', options: ['Horká čokoláda', 'Limonáda', 'Ledový čaj', 'Kola'], correctIndex: 0, difficulty: 'easy' },
  { id: 't11', prompt: 'Ve filmu “Sám doma” jak se jmenuje kluk?', options: ['Kevin', 'Tom', 'Harry', 'Peter'], correctIndex: 0, difficulty: 'easy' },
  { id: 't12', prompt: 'Pod čím se lidé o Vánocích líbají?', options: ['Jmelí', 'Dub', 'Palma', 'Slunečnice'], correctIndex: 0, difficulty: 'easy' },
  { id: 't13', prompt: 'Kolik duchů navštíví Scrooge (včetně Marleyho)?', options: ['4', '3', '2', '5'], correctIndex: 0, difficulty: 'medium' },
  { id: 't14', prompt: 'V jakém měsíci jsou Vánoce?', options: ['Prosinec', 'Listopad', 'Leden', 'Říjen'], correctIndex: 0, difficulty: 'easy' },
  { id: 't15', prompt: 'Jaký tvar mívá cukrová hůl?', options: ['Háček', 'Kruh', 'Trojúhelník', 'Čtverec'], correctIndex: 0, difficulty: 'easy' },
  { id: 't16', prompt: 'K čemu slouží balicí papír?', options: ['Balit dárky', 'Vařit', 'Sázet semínka', 'Spravovat boty'], correctIndex: 0, difficulty: 'easy' },
  { id: 't17', prompt: 'Jak se říká Santovým pomocníkům v dílně?', options: ['Skřítci', 'Obři', 'Kouzelníci', 'Piráti'], correctIndex: 0, difficulty: 'easy' },
  { id: 't18', prompt: 'Co z toho NENÍ typická vánoční dekorace?', options: ['Plážový míč', 'Věnec', 'Světýlka', 'Girlanda'], correctIndex: 0, difficulty: 'easy' },
  { id: 't19', prompt: 'Které zvíře se často zobrazuje jako tažné u Santových saní?', options: ['Sob', 'Kůň', 'Pes', 'Velbloud'], correctIndex: 0, difficulty: 'easy' },
  { id: 't20', prompt: 'Která rostlina se často pojí s Vánoci (červené listy)?', options: ['Vánoční hvězda', 'Tulipán', 'Růže', 'Slunečnice'], correctIndex: 0, difficulty: 'medium' },
  { id: 't21', prompt: 'Jak se říká zpívání koled (např. po domech)?', options: ['Koledování', 'Pochodování', 'Běhání', 'Šermování'], correctIndex: 0, difficulty: 'medium' },
  { id: 't22', prompt: 'Co je typický vánoční dezert?', options: ['Perník', 'Sushi', 'Tacos', 'Curry'], correctIndex: 0, difficulty: 'easy' },
  { id: 't23', prompt: 'Ve filmu “Elf” co Buddy miluje nejvíc?', options: ['Sirup', 'Sůl', 'Hořčici', 'Pepř'], correctIndex: 0, difficulty: 'easy' },
  { id: 't24', prompt: 'Co znamená “Noël” v angličtině?', options: ['Christmas', 'Snow', 'Gift', 'Song'], correctIndex: 0, difficulty: 'hard' },
  { id: 't25', prompt: 'Co obvykle posíláš s přáním “Veselé Vánoce”?', options: ['Přáníčko', 'Fakturu', 'Lístek', 'Účtenku'], correctIndex: 0, difficulty: 'easy' },
  { id: 't26', prompt: 'Jakou barvu mívají vánoční punčochy v obrázcích nejčastěji?', options: ['Červenou', 'Fialovou', 'Oranžovou', 'Černou'], correctIndex: 0, difficulty: 'easy' },
  { id: 't27', prompt: 'Co se často dává do punčochy?', options: ['Drobnosti / sladkosti', 'Boty', 'Voda', 'Písek'], correctIndex: 0, difficulty: 'easy' },
  { id: 't28', prompt: 'Které z toho je vánoční píseň?', options: ['Tichá noc', 'Všechno nejlepší', 'Motiv z Čelistí', 'Baby Shark'], correctIndex: 0, difficulty: 'easy' },
  { id: 't29', prompt: 'Co si lidé často staví ze sněhu?', options: ['Sněhuláka', 'Hrad z písku', 'Loď', 'Dům'], correctIndex: 0, difficulty: 'easy' },
  { id: 't30', prompt: 'Co se používá na zdobení stromku jako lesklé “vlákno”?', options: ['Lameta', 'Lepicí páska', 'Provaz', 'Drát'], correctIndex: 0, difficulty: 'easy' },
];

export const codePuzzles: CodePuzzle[] = [
  {
    id: 'c01',
    prompt: {
      en: 'Code puzzle: Count the symbols.\n\n🎄🎄🎄 + ⭐⭐ + 🎁🎁🎁🎁\n\nWrite the code as: trees, stars, gifts (4 digits total).',
      cs: 'Kódová hádanka: Spočítej symboly.\n\n🎄🎄🎄 + ⭐⭐ + 🎁🎁🎁🎁\n\nKód zapiš jako: stromky, hvězdy, dárky (celkem 4 číslice).',
    },
    hint: { en: '3 trees, 2 stars, 4 gifts', cs: '3 stromky, 2 hvězdy, 4 dárky' },
    code: '0324',
  },
  {
    id: 'c02',
    prompt: {
      en: 'Anagram: REDENIER.\n\nUnscramble the word, then count its letters.\n\nCode = 0000 + number of letters (4 digits).',
      cs: 'Přesmyčka: REDENIER.\n\nSlož slovo, pak spočítej písmena.\n\nKód = 0000 + počet písmen (4 číslice).',
    },
    hint: { en: 'A Christmas animal', cs: 'Vánoční zvíře' },
    code: '0008',
  },
  {
    id: 'c03',
    prompt: {
      en: 'Mini-math:\n\nIf Santa has 12 cookies and eats 3, then gives 4 away…\nHow many cookies left?\n\nCode = 0000 + result (4 digits).',
      cs: 'Mini-matematika:\n\nKdyž má Santa 12 sušenek a sní 3, pak 4 rozdá…\nKolik mu zbude?\n\nKód = 0000 + výsledek (4 číslice).',
    },
    code: '0005',
  },
  {
    id: 'c04',
    prompt: {
      en: 'Sequence:\n\n2, 4, 6, 8, __\n\nCode = 0000 + missing number (4 digits).',
      cs: 'Posloupnost:\n\n2, 4, 6, 8, __\n\nKód = 0000 + chybějící číslo (4 číslice).',
    },
    code: '0010',
  },
  {
    id: 'c05',
    prompt: {
      en: 'Count the letters:\n\nCHRISTMAS\n\nCode = 0000 + number of letters (4 digits).',
      cs: 'Spočítej písmena:\n\nCHRISTMAS\n\nKód = 0000 + počet písmen (4 číslice).',
    },
    hint: { en: 'Use the word shown.', cs: 'Použij slovo, které vidíš.' },
    code: '0009',
  },
  {
    id: 'c06',
    prompt: {
      en: 'Logic:\n\nIf 1 candle = 2 points\nand 1 bell = 3 points\n\n🕯️🕯️🔔 = ? points\n\nCode = 0000 + points (4 digits).',
      cs: 'Logika:\n\nKdyž 1 svíčka = 2 body\na 1 zvonek = 3 body\n\n🕯️🕯️🔔 = ? bodů\n\nKód = 0000 + body (4 číslice).',
    },
    code: '0007',
  },
  {
    id: 'c07',
    prompt: {
      en: 'Reverse:\n\nWrite the number 12 backwards.\n\nCode = 00 + backwards number (4 digits).',
      cs: 'Pozpátku:\n\nNapiš číslo 12 pozpátku.\n\nKód = 00 + číslo pozpátku (4 číslice).',
    },
    code: '0021',
  },
  {
    id: 'c08',
    prompt: {
      en: 'Count the vowels in: REINDEER\n\nCode = 0000 + vowel count (4 digits).',
      cs: 'Spočítej samohlásky ve slově: REINDEER\n\nKód = 0000 + počet samohlásek (4 číslice).',
    },
    code: '0004',
  },
  {
    id: 'c09',
    prompt: {
      en: 'Pattern:\n\n1, 1, 2, 3, 5, __\n\nCode = 0000 + missing number (4 digits).',
      cs: 'Vzor:\n\n1, 1, 2, 3, 5, __\n\nKód = 0000 + chybějící číslo (4 číslice).',
    },
    code: '0008',
  },
  {
    id: 'c10',
    prompt: {
      en: 'Count the items:\n\n🎁🎁🎁🎁🎁🎁🎁\n\nCode = 0000 + count (4 digits).',
      cs: 'Spočítej předměty:\n\n🎁🎁🎁🎁🎁🎁🎁\n\nKód = 0000 + počet (4 číslice).',
    },
    code: '0007',
  },
  {
    id: 'c11',
    prompt: {
      en: 'Word math:\n\nSANTA has 5 letters.\nTREE has 4 letters.\n\nCode = 00 + (SANTA letters) + (TREE letters) (4 digits).',
      cs: 'Slovní matematika:\n\nSANTA má 5 písmen.\nTREE má 4 písmena.\n\nKód = 00 + (SANTA) + (TREE) (4 číslice).',
    },
    code: '0054',
  },
  {
    id: 'c12',
    prompt: {
      en: 'Quick riddle:\n\nHow many sides does a snowflake have (simple answer)?\n\nCode = 0000 + answer (4 digits).',
      cs: 'Rychlá hádanka:\n\nKolik má sněhová vločka “stran” (jednoduchá odpověď)?\n\nKód = 0000 + odpověď (4 číslice).',
    },
    // Common simple answer is 6
    code: '0006',
  },
];

export const photoPrompts: PhotoPrompt[] = [
  { id: 'p01', prompt: { en: 'Take a photo with something red and something green in the same frame.', cs: 'Vyfoť něco červeného a něco zeleného v jednom záběru.' } },
  { id: 'p02', prompt: { en: 'Find (and photograph) the funniest Christmas decoration in the room.', cs: 'Najdi (a vyfoť) nejvtipnější vánoční dekoraci v místnosti.' } },
  { id: 'p03', prompt: { en: 'Photo of a mug/cup with a holiday drink (real or pretend).', cs: 'Foto hrnku s vánočním nápojem (skutečným nebo “jakože”).' } },
  { id: 'p04', prompt: { en: 'Selfie: your best “I just opened the perfect gift” face.', cs: 'Selfie: nejlepší výraz “právě jsem rozbalil/a perfektní dárek”.' } },
  { id: 'p05', prompt: { en: 'Photo of a sock/stocking (any sock counts).', cs: 'Vyfoť ponožku/punčochu (stačí jakákoliv ponožka).' } },
  { id: 'p06', prompt: { en: 'Find something that jingles. Photo it.', cs: 'Najdi něco, co cinká. Vyfoť to.' } },
  { id: 'p07', prompt: { en: 'Photo of a star shape (on anything).', cs: 'Vyfoť tvar hvězdy (na čemkoliv).' } },
  { id: 'p08', prompt: { en: 'Photo of a candle (lit or unlit).', cs: 'Vyfoť svíčku (zapálenou nebo ne).' } },
  { id: 'p09', prompt: { en: 'Photo of a wrapped present (or something wrapped like a present).', cs: 'Vyfoť zabalený dárek (nebo něco zabalené jako dárek).' } },
  { id: 'p10', prompt: { en: 'Find a reindeer (toy, picture, decoration). Photo it.', cs: 'Najdi soba (hračku, obrázek, dekoraci). Vyfoť ho.' } },
  { id: 'p11', prompt: { en: 'Photo of the coziest blanket you can find.', cs: 'Vyfoť nejútulnější deku, kterou najdeš.' } },
  { id: 'p12', prompt: { en: 'Photo of something sparkly/shiny.', cs: 'Vyfoť něco třpytivého/lesklého.' } },
  { id: 'p13', prompt: { en: 'Photo of a Christmas movie on a screen (TV/phone) or a movie poster.', cs: 'Vyfoť vánoční film na obrazovce (TV/telefon) nebo plakát.' } },
  { id: 'p14', prompt: { en: 'Selfie: your best Santa pose.', cs: 'Selfie: nejlepší Santovská póza.' } },
  { id: 'p15', prompt: { en: 'Photo of a Christmas snack (cookies, sweets, fruit… anything).', cs: 'Vyfoť vánoční mňamku (cukroví, sladkosti, ovoce… cokoliv).' } },
  { id: 'p16', prompt: { en: 'Find something shaped like a tree. Photo it.', cs: 'Najdi něco ve tvaru stromku. Vyfoť to.' } },
  { id: 'p17', prompt: { en: 'Photo of a hat (bonus if it’s festive).', cs: 'Vyfoť čepici/klobouk (bonus, když je vánoční).' } },
  { id: 'p18', prompt: { en: 'Photo of the brightest light you can find (safe!).', cs: 'Vyfoť nejjasnější světlo, které najdeš (bezpečně!).' } },
  { id: 'p19', prompt: { en: 'Photo of someone’s hands holding a gift (ask first).', cs: 'Vyfoť něčí ruce s dárkem (nejdřív se zeptej).' } },
  { id: 'p20', prompt: { en: 'Photo of something that smells like Christmas (spices, tree, cookies… choose one).', cs: 'Vyfoť něco, co voní jako Vánoce (koření, stromek, cukroví… vyber jedno).' } },
];

export const christmasRaceV1: RaceTrack = {
  id: 'christmas_race_v1',
  title: { en: 'Christmas Amazing Race', cs: 'Vánoční Amazing Race' },
  stages: [
    {
      id: 'stage_1_riddle_gate',
      type: 'riddle_gate',
      title: { en: 'Riddle Gate', cs: 'Hádanková brána' },
      description: {
        en: 'Solve a quick riddle to unlock the race.',
        cs: 'Vyřeš rychlou hádanku a odemkni závod.',
      },
      rules: {
        en: 'Type the answer. Spelling is flexible.',
        cs: 'Napiš odpověď. Na pravopisu tolik nezáleží.',
      },
      scoring: {
        en: '+10 points, plus up to +5 speed bonus.',
        cs: '+10 bodů, plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'riddle_gate_pool',
        pick: 1,
      },
    },
    {
      id: 'stage_2_emoji_guess',
      type: 'emoji_guess',
      title: { en: 'Emoji Movie / Song Guess', cs: 'Hádej film/píseň z emoji' },
      description: {
        en: 'Solve 3 out of 5 emoji clues.',
        cs: 'Uhodni 3 z 5 emoji hádanek.',
      },
      rules: {
        en: 'Pick the right answer. Wrong answers cause a short lockout.',
        cs: 'Vyber správnou odpověď. Špatně = krátká pauza.',
      },
      scoring: {
        en: '+15 points, plus up to +5 speed bonus.',
        cs: '+15 bodů, plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'emoji_clues',
        pick: 5,
        needCorrect: 3,
        lockoutMs: 10_000,
      },
    },
    {
      id: 'stage_3_trivia_solo',
      type: 'trivia_solo',
      title: { en: 'Solo Trivia', cs: 'Sólo trivia' },
      description: {
        en: 'Answer 5 quick questions. You’re racing — not waiting.',
        cs: 'Odpověz na 5 rychlých otázek. Závodíš — nečekáš.',
      },
      rules: {
        en: '20 seconds per question. Timeouts count as wrong and move on.',
        cs: '20 sekund na otázku. Po vypršení se bere jako špatně a jde se dál.',
      },
      scoring: {
        en: '+4 per correct (up to +20), plus up to +5 speed bonus.',
        cs: '+4 za správně (max +20), plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'trivia_pool',
        pick: 5,
        secondsPerQuestion: 20,
      },
    },
    {
      id: 'stage_4_code_lock',
      type: 'code_lock',
      title: { en: 'Code Lock', cs: 'Kódový zámek' },
      description: {
        en: 'Solve the puzzle to discover a 4-digit code.',
        cs: 'Vyřeš hádanku a získej čtyřmístný kód.',
      },
      rules: {
        en: 'Enter the 4-digit code. Wrong codes cause a short lockout.',
        cs: 'Zadej 4místný kód. Špatně = krátká pauza.',
      },
      scoring: {
        en: '+15 points, plus up to +5 speed bonus.',
        cs: '+15 bodů, plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'code_puzzles',
        pick: 1,
        lockoutMs: 10_000,
      },
    },
    {
      id: 'stage_5_photo_scavenger',
      type: 'photo_scavenger',
      title: { en: 'Photo Scavenger', cs: 'Foto scavenger' },
      description: {
        en: 'Do the prompt. Upload a photo for bonus points (optional).',
        cs: 'Splň zadání. Nahraj fotku pro bonus (volitelné).',
      },
      rules: {
        en: 'Honor system allowed. You can mark “Done” even without a photo.',
        cs: 'Může to být na čest. Můžeš dát “Hotovo” i bez fotky.',
      },
      scoring: {
        en: '+10 points, +5 bonus if photo uploaded, plus up to +5 speed bonus.',
        cs: '+10 bodů, +5 bonus za fotku, plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'photo_prompts',
        pick: 1,
        photoBonus: 5,
      },
    },
    {
      id: 'stage_6_final_riddle',
      type: 'final_riddle',
      title: { en: 'Final Riddle', cs: 'Finální hádanka' },
      description: {
        en: 'One last quick puzzle to finish the race.',
        cs: 'Poslední rychlá hádanka a jdeš do cíle.',
      },
      rules: {
        en: 'Answer correctly to finish. Spelling is flexible.',
        cs: 'Odpověz správně a jsi v cíli. Pravopis neřeš.',
      },
      scoring: {
        en: '+25 points, plus up to +5 speed bonus.',
        cs: '+25 bodů, plus až +5 rychlostní bonus.',
      },
      content: {
        poolId: 'final_riddle_pool',
        pick: 1,
      },
    },
  ],
};

export function getTriviaPool(lang: 'en' | 'cs'): TriviaQuestion[] {
  return lang === 'cs' ? triviaPoolCs : triviaPool;
}

