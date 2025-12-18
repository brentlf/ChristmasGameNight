export interface EmojiItem {
  id: string;
  emoji: string;
  correct: {
    en: string;
    cs: string;
  };
  acceptedAliases: {
    en: string[];
    cs: string[];
  };
  decoyOptions: {
    en: string[];
    cs: string[];
  };
}

export const emojiMoviesChristmasPool: EmojiItem[] = [
  {
    id: 'emoji_1',
    emoji: '🏠👦',
    correct: {
      en: 'Home Alone',
      cs: 'Sám doma',
    },
    acceptedAliases: {
      en: ['Home Alone', 'Home Alone 1'],
      cs: ['Sám doma', 'Sám doma 1'],
    },
    decoyOptions: {
      en: ['The Grinch', 'Elf', 'A Christmas Story'],
      cs: ['Grinch', 'Elf', 'Vánoční příběh'],
    },
  },
  {
    id: 'emoji_2',
    emoji: '🎄👹',
    correct: {
      en: 'How the Grinch Stole Christmas',
      cs: 'Jak Grinch ukradl Vánoce',
    },
    acceptedAliases: {
      en: ['The Grinch', 'Grinch', 'How the Grinch Stole Christmas'],
      cs: ['Grinch', 'Jak Grinch ukradl Vánoce'],
    },
    decoyOptions: {
      en: ['Elf', 'Home Alone', 'A Christmas Carol'],
      cs: ['Elf', 'Sám doma', 'Vánoční koleda'],
    },
  },
  {
    id: 'emoji_3',
    emoji: '🎅🎄',
    correct: {
      en: 'The Santa Clause',
      cs: 'Smlouva se Santou',
    },
    acceptedAliases: {
      en: ['The Santa Clause', 'Santa Clause'],
      cs: ['Smlouva se Santou', 'Santa Clause'],
    },
    decoyOptions: {
      en: ['Elf', 'The Polar Express', 'Miracle on 34th Street'],
      cs: ['Elf', 'Polární expres', 'Zázrak na 34. ulici'],
    },
  },
  {
    id: 'emoji_4',
    emoji: '🚂❄️',
    correct: {
      en: 'The Polar Express',
      cs: 'Polární expres',
    },
    acceptedAliases: {
      en: ['The Polar Express', 'Polar Express'],
      cs: ['Polární expres'],
    },
    decoyOptions: {
      en: ['Home Alone', 'Elf', 'A Christmas Story'],
      cs: ['Sám doma', 'Elf', 'Vánoční příběh'],
    },
  },
  {
    id: 'emoji_5',
    emoji: '🧝🎄',
    correct: {
      en: 'Elf',
      cs: 'Elf',
    },
    acceptedAliases: {
      en: ['Elf'],
      cs: ['Elf'],
    },
    decoyOptions: {
      en: ['The Grinch', 'Home Alone', 'A Christmas Carol'],
      cs: ['Grinch', 'Sám doma', 'Vánoční koleda'],
    },
  },
  {
    id: 'emoji_6',
    emoji: '🔫🎄',
    correct: {
      en: 'A Christmas Story',
      cs: 'Vánoční příběh',
    },
    acceptedAliases: {
      en: ['A Christmas Story', 'Christmas Story'],
      cs: ['Vánoční příběh'],
    },
    decoyOptions: {
      en: ['Home Alone', 'Elf', 'The Grinch'],
      cs: ['Sám doma', 'Elf', 'Grinch'],
    },
  },
  {
    id: 'emoji_7',
    emoji: '👻🎄',
    correct: {
      en: 'A Christmas Carol',
      cs: 'Vánoční koleda',
    },
    acceptedAliases: {
      en: ['A Christmas Carol', 'Christmas Carol', 'Scrooge'],
      cs: ['Vánoční koleda', 'Scrooge'],
    },
    decoyOptions: {
      en: ['The Grinch', 'Elf', 'Home Alone'],
      cs: ['Grinch', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_8',
    emoji: '❄️👸',
    correct: {
      en: 'Frozen',
      cs: 'Ledové království',
    },
    acceptedAliases: {
      en: ['Frozen'],
      cs: ['Ledové království', 'Frozen'],
    },
    decoyOptions: {
      en: ['The Polar Express', 'Elf', 'Home Alone'],
      cs: ['Polární expres', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_9',
    emoji: '🎄🌟',
    correct: {
      en: 'It\'s a Wonderful Life',
      cs: 'Je to báječný život',
    },
    acceptedAliases: {
      en: ['It\'s a Wonderful Life', 'Wonderful Life'],
      cs: ['Je to báječný život', 'Báječný život'],
    },
    decoyOptions: {
      en: ['A Christmas Carol', 'Miracle on 34th Street', 'The Santa Clause'],
      cs: ['Vánoční koleda', 'Zázrak na 34. ulici', 'Smlouva se Santou'],
    },
  },
  {
    id: 'emoji_10',
    emoji: '🏪🎄',
    correct: {
      en: 'Miracle on 34th Street',
      cs: 'Zázrak na 34. ulici',
    },
    acceptedAliases: {
      en: ['Miracle on 34th Street', 'Miracle on 34th'],
      cs: ['Zázrak na 34. ulici'],
    },
    decoyOptions: {
      en: ['The Santa Clause', 'Elf', 'Home Alone'],
      cs: ['Smlouva se Santou', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_11',
    emoji: '🔔🛷',
    correct: {
      en: 'Jingle Bells',
      cs: 'Rolničky',
    },
    acceptedAliases: {
      en: ['Jingle Bells'],
      cs: ['Rolničky', 'Jingle Bells'],
    },
    decoyOptions: {
      en: ['Silent Night', 'White Christmas', 'Rudolph the Red-Nosed Reindeer'],
      cs: ['Tichá noc', 'Bílé Vánoce', 'Rudolf s červeným nosem'],
    },
  },
  {
    id: 'emoji_12',
    emoji: '❄️🎄',
    correct: {
      en: 'White Christmas',
      cs: 'Bílé Vánoce',
    },
    acceptedAliases: {
      en: ['White Christmas'],
      cs: ['Bílé Vánoce', 'White Christmas'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Silent Night', 'Let It Snow'],
      cs: ['Rolničky', 'Tichá noc', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_13',
    emoji: '🔴👃🦌',
    correct: {
      en: 'Rudolph the Red-Nosed Reindeer',
      cs: 'Rudolf s červeným nosem',
    },
    acceptedAliases: {
      en: ['Rudolph', 'Rudolph the Red-Nosed Reindeer'],
      cs: ['Rudolf', 'Rudolf s červeným nosem'],
    },
    decoyOptions: {
      en: ['Frosty the Snowman', 'Jingle Bells', 'White Christmas'],
      cs: ['Sněhulák Frosty', 'Rolničky', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_14',
    emoji: '⛄❄️',
    correct: {
      en: 'Frosty the Snowman',
      cs: 'Sněhulák Frosty',
    },
    acceptedAliases: {
      en: ['Frosty', 'Frosty the Snowman'],
      cs: ['Frosty', 'Sněhulák Frosty'],
    },
    decoyOptions: {
      en: ['Rudolph', 'Jingle Bells', 'Let It Snow'],
      cs: ['Rudolf', 'Rolničky', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_15',
    emoji: '🔔🎄',
    correct: {
      en: 'Silent Night',
      cs: 'Tichá noc',
    },
    acceptedAliases: {
      en: ['Silent Night'],
      cs: ['Tichá noc', 'Silent Night'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'O Holy Night'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Ó svatá noc'],
    },
  },
  {
    id: 'emoji_16',
    emoji: '💝❤️',
    correct: {
      en: 'All I Want for Christmas Is You',
      cs: 'Všechno, co k Vánocům chci, jsi ty',
    },
    acceptedAliases: {
      en: ['All I Want for Christmas Is You', 'All I Want for Christmas'],
      cs: ['Všechno, co k Vánocům chci, jsi ty'],
    },
    decoyOptions: {
      en: ['Last Christmas', 'Jingle Bells', 'White Christmas'],
      cs: ['Minulé Vánoce', 'Rolničky', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_17',
    emoji: '🎅🏘️',
    correct: {
      en: 'Santa Claus Is Coming to Town',
      cs: 'Santa Claus přijíždí do města',
    },
    acceptedAliases: {
      en: ['Santa Claus Is Coming to Town', 'Santa Claus Is Coming'],
      cs: ['Santa Claus přijíždí do města'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Rudolph', 'Frosty'],
      cs: ['Rolničky', 'Rudolf', 'Frosty'],
    },
  },
  {
    id: 'emoji_18',
    emoji: '❄️🎵',
    correct: {
      en: 'Let It Snow',
      cs: 'Ať sněží',
    },
    acceptedAliases: {
      en: ['Let It Snow', 'Let It Snow Let It Snow'],
      cs: ['Ať sněží'],
    },
    decoyOptions: {
      en: ['White Christmas', 'Jingle Bells', 'Frosty'],
      cs: ['Bílé Vánoce', 'Rolničky', 'Frosty'],
    },
  },
  {
    id: 'emoji_19',
    emoji: '⭐🌙',
    correct: {
      en: 'O Holy Night',
      cs: 'Ó svatá noc',
    },
    acceptedAliases: {
      en: ['O Holy Night', 'Oh Holy Night'],
      cs: ['Ó svatá noc'],
    },
    decoyOptions: {
      en: ['Silent Night', 'Jingle Bells', 'White Christmas'],
      cs: ['Tichá noc', 'Rolničky', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_20',
    emoji: '🎁💝',
    correct: {
      en: 'Last Christmas',
      cs: 'Minulé Vánoce',
    },
    acceptedAliases: {
      en: ['Last Christmas'],
      cs: ['Minulé Vánoce', 'Last Christmas'],
    },
    decoyOptions: {
      en: ['All I Want for Christmas', 'Jingle Bells', 'White Christmas'],
      cs: ['Všechno, co k Vánocům chci', 'Rolničky', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_21',
    emoji: '🔥🌰',
    correct: {
      en: 'The Christmas Song',
      cs: 'Vánoční píseň',
    },
    acceptedAliases: {
      en: ['The Christmas Song', 'Chestnuts Roasting', 'Chestnuts Roasting on an Open Fire'],
      cs: ['Vánoční píseň'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Let It Snow'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_22',
    emoji: '🎃🎄',
    correct: {
      en: 'The Nightmare Before Christmas',
      cs: 'Noční můra před Vánocemi',
    },
    acceptedAliases: {
      en: ['The Nightmare Before Christmas', 'Nightmare Before Christmas'],
      cs: ['Noční můra před Vánocemi'],
    },
    decoyOptions: {
      en: ['The Grinch', 'Elf', 'Home Alone'],
      cs: ['Grinch', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_23',
    emoji: '🎄❤️',
    correct: {
      en: 'Love Actually',
      cs: 'Láska nebeská',
    },
    acceptedAliases: {
      en: ['Love Actually'],
      cs: ['Láska nebeská', 'Love Actually'],
    },
    decoyOptions: {
      en: ['The Holiday', 'Elf', 'Home Alone'],
      cs: ['Prázdniny', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_24',
    emoji: '🎄🏠',
    correct: {
      en: 'The Family Stone',
      cs: 'Rodinný kámen',
    },
    acceptedAliases: {
      en: ['The Family Stone'],
      cs: ['Rodinný kámen'],
    },
    decoyOptions: {
      en: ['Home Alone', 'Love Actually', 'The Holiday'],
      cs: ['Sám doma', 'Láska nebeská', 'Prázdniny'],
    },
  },
  {
    id: 'emoji_25',
    emoji: '🎄🎬',
    correct: {
      en: 'The Holiday',
      cs: 'Prázdniny',
    },
    acceptedAliases: {
      en: ['The Holiday'],
      cs: ['Prázdniny', 'The Holiday'],
    },
    decoyOptions: {
      en: ['Love Actually', 'Elf', 'Home Alone'],
      cs: ['Láska nebeská', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_26',
    emoji: '📖🎅',
    correct: {
      en: 'The Christmas Chronicles',
      cs: 'Vánoční kroniky',
    },
    acceptedAliases: {
      en: ['The Christmas Chronicles', 'Christmas Chronicles'],
      cs: ['Vánoční kroniky'],
    },
    decoyOptions: {
      en: ['The Santa Clause', 'Elf', 'Home Alone'],
      cs: ['Smlouva se Santou', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_27',
    emoji: '🎄🎭',
    correct: {
      en: 'The Muppet Christmas Carol',
      cs: 'Vánoční koleda Muppetů',
    },
    acceptedAliases: {
      en: ['The Muppet Christmas Carol', 'Muppet Christmas Carol'],
      cs: ['Vánoční koleda Muppetů'],
    },
    decoyOptions: {
      en: ['A Christmas Carol', 'Elf', 'The Grinch'],
      cs: ['Vánoční koleda', 'Elf', 'Grinch'],
    },
  },
  {
    id: 'emoji_28',
    emoji: '🥜⚙️',
    correct: {
      en: 'The Nutcracker',
      cs: 'Louskáček',
    },
    acceptedAliases: {
      en: ['The Nutcracker', 'Nutcracker'],
      cs: ['Louskáček'],
    },
    decoyOptions: {
      en: ['Frozen', 'Elf', 'Home Alone'],
      cs: ['Ledové království', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_29',
    emoji: '🇲🇽🎉',
    correct: {
      en: 'Feliz Navidad',
      cs: 'Feliz Navidad',
    },
    acceptedAliases: {
      en: ['Feliz Navidad'],
      cs: ['Feliz Navidad'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Silent Night'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Tichá noc'],
    },
  },
  {
    id: 'emoji_30',
    emoji: '☕🎄',
    correct: {
      en: 'Have Yourself a Merry Little Christmas',
      cs: 'Užij si malé veselé Vánoce',
    },
    acceptedAliases: {
      en: ['Have Yourself a Merry Little Christmas', 'Merry Little Christmas'],
      cs: ['Užij si malé veselé Vánoce'],
    },
    decoyOptions: {
      en: ['White Christmas', 'Jingle Bells', 'Let It Snow'],
      cs: ['Bílé Vánoce', 'Rolničky', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_31',
    emoji: '🎄🎵',
    correct: {
      en: 'Rockin\' Around the Christmas Tree',
      cs: 'Rockin\' Around the Christmas Tree',
    },
    acceptedAliases: {
      en: ['Rockin\' Around the Christmas Tree', 'Rockin Around the Christmas Tree'],
      cs: ['Rockin\' Around the Christmas Tree'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Let It Snow'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_32',
    emoji: '🏛️✨',
    correct: {
      en: 'Deck the Halls',
      cs: 'Ozdobme síně',
    },
    acceptedAliases: {
      en: ['Deck the Halls'],
      cs: ['Ozdobme síně', 'Deck the Halls'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Silent Night', 'White Christmas'],
      cs: ['Rolničky', 'Tichá noc', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_33',
    emoji: '🍷🎄',
    correct: {
      en: 'We Wish You a Merry Christmas',
      cs: 'Přejeme vám veselé Vánoce',
    },
    acceptedAliases: {
      en: ['We Wish You a Merry Christmas', 'Merry Christmas'],
      cs: ['Přejeme vám veselé Vánoce', 'Veselé Vánoce'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Silent Night'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Tichá noc'],
    },
  },
  {
    id: 'emoji_34',
    emoji: '🕐🕐🕐',
    correct: {
      en: 'The Twelve Days of Christmas',
      cs: 'Dvanáct dní Vánoc',
    },
    acceptedAliases: {
      en: ['The Twelve Days of Christmas', 'Twelve Days of Christmas'],
      cs: ['Dvanáct dní Vánoc'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Silent Night'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Tichá noc'],
    },
  },
  {
    id: 'emoji_35',
    emoji: '👼🎺',
    correct: {
      en: 'Hark! The Herald Angels Sing',
      cs: 'Slyšte, andělé zpívají',
    },
    acceptedAliases: {
      en: ['Hark! The Herald Angels Sing', 'Hark The Herald Angels Sing'],
      cs: ['Slyšte, andělé zpívají'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
  {
    id: 'emoji_36',
    emoji: '🌍🎉',
    correct: {
      en: 'Joy to the World',
      cs: 'Raduj se, světe',
    },
    acceptedAliases: {
      en: ['Joy to the World'],
      cs: ['Raduj se, světe', 'Joy to the World'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'White Christmas', 'Silent Night'],
      cs: ['Rolničky', 'Bílé Vánoce', 'Tichá noc'],
    },
  },
  {
    id: 'emoji_37',
    emoji: '🎄🎵',
    correct: {
      en: 'A Charlie Brown Christmas',
      cs: 'Vánoční příběh Charlieho Browna',
    },
    acceptedAliases: {
      en: ['A Charlie Brown Christmas', 'Charlie Brown Christmas'],
      cs: ['Vánoční příběh Charlieho Browna'],
    },
    decoyOptions: {
      en: ['Home Alone', 'Elf', 'The Grinch'],
      cs: ['Sám doma', 'Elf', 'Grinch'],
    },
  },
  {
    id: 'emoji_38',
    emoji: '📅❌🎅',
    correct: {
      en: 'The Year Without a Santa Claus',
      cs: 'Rok bez Santa Clause',
    },
    acceptedAliases: {
      en: ['The Year Without a Santa Claus', 'Year Without a Santa Claus'],
      cs: ['Rok bez Santa Clause'],
    },
    decoyOptions: {
      en: ['The Santa Clause', 'Elf', 'Home Alone'],
      cs: ['Smlouva se Santou', 'Elf', 'Sám doma'],
    },
  },
  {
    id: 'emoji_39',
    emoji: '❄️🚪',
    correct: {
      en: 'Baby It\'s Cold Outside',
      cs: 'Zlato, venku je zima',
    },
    acceptedAliases: {
      en: ['Baby It\'s Cold Outside', 'Baby Its Cold Outside'],
      cs: ['Zlato, venku je zima'],
    },
    decoyOptions: {
      en: ['Let It Snow', 'White Christmas', 'Jingle Bells'],
      cs: ['Ať sněží', 'Bílé Vánoce', 'Rolničky'],
    },
  },
  {
    id: 'emoji_40',
    emoji: '❄️🏔️',
    correct: {
      en: 'Winter Wonderland',
      cs: 'Zimní pohádka',
    },
    acceptedAliases: {
      en: ['Winter Wonderland'],
      cs: ['Zimní pohádka', 'Winter Wonderland'],
    },
    decoyOptions: {
      en: ['Let It Snow', 'White Christmas', 'Jingle Bells'],
      cs: ['Ať sněží', 'Bílé Vánoce', 'Rolničky'],
    },
  },
  {
    id: 'emoji_41',
    emoji: '🛷🐴',
    correct: {
      en: 'Sleigh Ride',
      cs: 'Jízda na saních',
    },
    acceptedAliases: {
      en: ['Sleigh Ride'],
      cs: ['Jízda na saních', 'Sleigh Ride'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Let It Snow', 'White Christmas'],
      cs: ['Rolničky', 'Ať sněží', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_42',
    emoji: '🥁👶',
    correct: {
      en: 'The Little Drummer Boy',
      cs: 'Malý bubeník',
    },
    acceptedAliases: {
      en: ['The Little Drummer Boy', 'Little Drummer Boy'],
      cs: ['Malý bubeník'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Silent Night', 'O Holy Night'],
      cs: ['Rolničky', 'Tichá noc', 'Ó svatá noc'],
    },
  },
  {
    id: 'emoji_43',
    emoji: '👂👂',
    correct: {
      en: 'Do You Hear What I Hear?',
      cs: 'Slyšíš, co slyším?',
    },
    acceptedAliases: {
      en: ['Do You Hear What I Hear?', 'Do You Hear What I Hear'],
      cs: ['Slyšíš, co slyším?'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
  {
    id: 'emoji_44',
    emoji: '🏠✈️',
    correct: {
      en: 'I\'ll Be Home for Christmas',
      cs: 'Budu doma na Vánoce',
    },
    acceptedAliases: {
      en: ['I\'ll Be Home for Christmas', 'Ill Be Home for Christmas'],
      cs: ['Budu doma na Vánoce'],
    },
    decoyOptions: {
      en: ['White Christmas', 'Jingle Bells', 'Let It Snow'],
      cs: ['Bílé Vánoce', 'Rolničky', 'Ať sněží'],
    },
  },
  {
    id: 'emoji_45',
    emoji: '🔔💎',
    correct: {
      en: 'Silver Bells',
      cs: 'Stříbrné zvony',
    },
    acceptedAliases: {
      en: ['Silver Bells'],
      cs: ['Stříbrné zvony', 'Silver Bells'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Silent Night', 'White Christmas'],
      cs: ['Rolničky', 'Tichá noc', 'Bílé Vánoce'],
    },
  },
  {
    id: 'emoji_46',
    emoji: '1️⃣⭐',
    correct: {
      en: 'The First Noel',
      cs: 'První Vánoce',
    },
    acceptedAliases: {
      en: ['The First Noel', 'First Noel'],
      cs: ['První Vánoce'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
  {
    id: 'emoji_47',
    emoji: '🙏👨',
    correct: {
      en: 'God Rest Ye Merry Gentlemen',
      cs: 'Bůh odpočívej, veselí pánové',
    },
    acceptedAliases: {
      en: ['God Rest Ye Merry Gentlemen', 'God Rest Ye Merry'],
      cs: ['Bůh odpočívej, veselí pánové'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
  {
    id: 'emoji_48',
    emoji: '🔔🔔',
    correct: {
      en: 'Carol of the Bells',
      cs: 'Koleda zvonů',
    },
    acceptedAliases: {
      en: ['Carol of the Bells'],
      cs: ['Koleda zvonů', 'Carol of the Bells'],
    },
    decoyOptions: {
      en: ['Jingle Bells', 'Silver Bells', 'Silent Night'],
      cs: ['Rolničky', 'Stříbrné zvony', 'Tichá noc'],
    },
  },
  {
    id: 'emoji_49',
    emoji: '👶🌾',
    correct: {
      en: 'Away in a Manger',
      cs: 'V jesličkách',
    },
    acceptedAliases: {
      en: ['Away in a Manger'],
      cs: ['V jesličkách', 'Away in a Manger'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
  {
    id: 'emoji_50',
    emoji: '❓👶',
    correct: {
      en: 'What Child Is This?',
      cs: 'Jaké to dítě je?',
    },
    acceptedAliases: {
      en: ['What Child Is This?', 'What Child Is This'],
      cs: ['Jaké to dítě je?'],
    },
    decoyOptions: {
      en: ['Silent Night', 'O Holy Night', 'Jingle Bells'],
      cs: ['Tichá noc', 'Ó svatá noc', 'Rolničky'],
    },
  },
];


