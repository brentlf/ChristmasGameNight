export interface GuessTheSongItem {
  id: string;
  audioSrc: string;
  variant: 'song_title' | 'artist' | 'movie' | 'lyrics';
  questionText: {
    en: string;
    cs: string;
  };
  correctAnswer: {
    en: string;
    cs: string;
  };
  options: {
    en: string[];
    cs: string[];
  };
  correctIndex: number; // 0-3
}

export const guessTheSongChristmasPool: GuessTheSongItem[] = [
  {
    id: 'song_1',
    audioSrc: '/audio/christmas_songs/jingle_bells_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Jingle Bells',
      cs: 'Jingle Bells',
    },
    options: {
      en: ['Jingle Bells', 'Silent Night', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Jingle Bells', 'Tichá noc', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_2',
    audioSrc: '/audio/christmas_songs/silent_night_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Silent Night',
      cs: 'Tichá noc',
    },
    options: {
      en: ['Silent Night', 'Jingle Bells', 'O Holy Night', 'Away in a Manger'],
      cs: ['Tichá noc', 'Jingle Bells', 'Ó svatá noc', 'V jesličkách'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_3',
    audioSrc: '/audio/christmas_songs/deck_the_halls_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Deck the Halls',
      cs: 'Nazdobme sál',
    },
    options: {
      en: ['Deck the Halls', 'We Wish You a Merry Christmas', 'Jingle Bells', 'The First Noel'],
      cs: ['Nazdobme sál', 'Přejeme vám veselé Vánoce', 'Jingle Bells', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_4',
    audioSrc: '/audio/christmas_songs/we_wish_you_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'We Wish You a Merry Christmas',
      cs: 'Přejeme vám veselé Vánoce',
    },
    options: {
      en: ['We Wish You a Merry Christmas', 'Jingle Bells', 'Silent Night', 'Joy to the World'],
      cs: ['Přejeme vám veselé Vánoce', 'Jingle Bells', 'Tichá noc', 'Radost světu'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_5',
    audioSrc: '/audio/christmas_songs/o_holy_night_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'O Holy Night',
      cs: 'Ó svatá noc',
    },
    options: {
      en: ['O Holy Night', 'Silent Night', 'Away in a Manger', 'Hark! The Herald Angels Sing'],
      cs: ['Ó svatá noc', 'Tichá noc', 'V jesličkách', 'Slyšte andělé zpívají'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_6',
    audioSrc: '/audio/christmas_songs/joy_to_the_world_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Joy to the World',
      cs: 'Radost světu',
    },
    options: {
      en: ['Joy to the World', 'We Wish You a Merry Christmas', 'Deck the Halls', 'The First Noel'],
      cs: ['Radost světu', 'Přejeme vám veselé Vánoce', 'Nazdobme sál', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_7',
    audioSrc: '/audio/christmas_songs/away_in_manger_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Away in a Manger',
      cs: 'V jesličkách',
    },
    options: {
      en: ['Away in a Manger', 'Silent Night', 'O Holy Night', 'The First Noel'],
      cs: ['V jesličkách', 'Tichá noc', 'Ó svatá noc', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_8',
    audioSrc: '/audio/christmas_songs/the_first_noel_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'The First Noel',
      cs: 'První Vánoce',
    },
    options: {
      en: ['The First Noel', 'O Holy Night', 'Away in a Manger', 'Hark! The Herald Angels Sing'],
      cs: ['První Vánoce', 'Ó svatá noc', 'V jesličkách', 'Slyšte andělé zpívají'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_9',
    audioSrc: '/audio/christmas_songs/hark_herald_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Hark! The Herald Angels Sing',
      cs: 'Slyšte andělé zpívají',
    },
    options: {
      en: ['Hark! The Herald Angels Sing', 'O Holy Night', 'The First Noel', 'Joy to the World'],
      cs: ['Slyšte andělé zpívají', 'Ó svatá noc', 'První Vánoce', 'Radost světu'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_10',
    audioSrc: '/audio/christmas_songs/white_christmas_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'White Christmas',
      cs: 'Bílé Vánoce',
    },
    options: {
      en: ['White Christmas', 'Jingle Bells', 'Silent Night', 'Deck the Halls'],
      cs: ['Bílé Vánoce', 'Jingle Bells', 'Tichá noc', 'Nazdobme sál'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_11',
    audioSrc: '/audio/christmas_songs/let_it_snow_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Let It Snow',
      cs: 'Ať sněží',
    },
    options: {
      en: ['Let It Snow', 'White Christmas', 'Jingle Bells', 'Winter Wonderland'],
      cs: ['Ať sněží', 'Bílé Vánoce', 'Jingle Bells', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_12',
    audioSrc: '/audio/christmas_songs/winter_wonderland_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Winter Wonderland',
      cs: 'Zimní pohádka',
    },
    options: {
      en: ['Winter Wonderland', 'Let It Snow', 'White Christmas', 'Jingle Bells'],
      cs: ['Zimní pohádka', 'Ať sněží', 'Bílé Vánoce', 'Jingle Bells'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_13',
    audioSrc: '/audio/christmas_songs/rockin_around_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Rockin\' Around the Christmas Tree',
      cs: 'Rockin\' Around the Christmas Tree',
    },
    options: {
      en: ['Rockin\' Around the Christmas Tree', 'Jingle Bell Rock', 'Let It Snow', 'White Christmas'],
      cs: ['Rockin\' Around the Christmas Tree', 'Jingle Bell Rock', 'Ať sněží', 'Bílé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_14',
    audioSrc: '/audio/christmas_songs/jingle_bell_rock_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Jingle Bell Rock',
      cs: 'Jingle Bell Rock',
    },
    options: {
      en: ['Jingle Bell Rock', 'Rockin\' Around the Christmas Tree', 'Jingle Bells', 'Let It Snow'],
      cs: ['Jingle Bell Rock', 'Rockin\' Around the Christmas Tree', 'Jingle Bells', 'Ať sněží'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_15',
    audioSrc: '/audio/christmas_songs/santa_claus_coming_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Santa Claus Is Coming to Town',
      cs: 'Santa Claus přichází do města',
    },
    options: {
      en: ['Santa Claus Is Coming to Town', 'Jingle Bells', 'Rudolph the Red-Nosed Reindeer', 'Frosty the Snowman'],
      cs: ['Santa Claus přichází do města', 'Jingle Bells', 'Rudolf s červeným nosem', 'Sněhulák Frosty'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_16',
    audioSrc: '/audio/christmas_songs/rudolph_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Rudolph the Red-Nosed Reindeer',
      cs: 'Rudolf s červeným nosem',
    },
    options: {
      en: ['Rudolph the Red-Nosed Reindeer', 'Santa Claus Is Coming to Town', 'Frosty the Snowman', 'Jingle Bells'],
      cs: ['Rudolf s červeným nosem', 'Santa Claus přichází do města', 'Sněhulák Frosty', 'Jingle Bells'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_17',
    audioSrc: '/audio/christmas_songs/frosty_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Frosty the Snowman',
      cs: 'Sněhulák Frosty',
    },
    options: {
      en: ['Frosty the Snowman', 'Rudolph the Red-Nosed Reindeer', 'Santa Claus Is Coming to Town', 'Jingle Bells'],
      cs: ['Sněhulák Frosty', 'Rudolf s červeným nosem', 'Santa Claus přichází do města', 'Jingle Bells'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_18',
    audioSrc: '/audio/christmas_songs/all_i_want_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'All I Want for Christmas Is You',
      cs: 'Všechno, co k Vánocům chci, jsi ty',
    },
    options: {
      en: ['All I Want for Christmas Is You', 'Last Christmas', 'White Christmas', 'Let It Snow'],
      cs: ['Všechno, co k Vánocům chci, jsi ty', 'Minulé Vánoce', 'Bílé Vánoce', 'Ať sněží'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_19',
    audioSrc: '/audio/christmas_songs/last_christmas_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Last Christmas',
      cs: 'Minulé Vánoce',
    },
    options: {
      en: ['Last Christmas', 'All I Want for Christmas Is You', 'White Christmas', 'Let It Snow'],
      cs: ['Minulé Vánoce', 'Všechno, co k Vánocům chci, jsi ty', 'Bílé Vánoce', 'Ať sněží'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_20',
    audioSrc: '/audio/christmas_songs/feliz_navidad_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Feliz Navidad',
      cs: 'Feliz Navidad',
    },
    options: {
      en: ['Feliz Navidad', 'Jingle Bells', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Feliz Navidad', 'Jingle Bells', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  // Adding more songs to reach 50...
  {
    id: 'song_21',
    audioSrc: '/audio/christmas_songs/12_days_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'The Twelve Days of Christmas',
      cs: 'Dvanáct dní Vánoc',
    },
    options: {
      en: ['The Twelve Days of Christmas', 'Jingle Bells', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Dvanáct dní Vánoc', 'Jingle Bells', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_22',
    audioSrc: '/audio/christmas_songs/chestnuts_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'The Christmas Song (Chestnuts Roasting)',
      cs: 'Vánoční píseň (Pečené kaštany)',
    },
    options: {
      en: ['The Christmas Song (Chestnuts Roasting)', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Vánoční píseň (Pečené kaštany)', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_23',
    audioSrc: '/audio/christmas_songs/have_yourself_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Have Yourself a Merry Little Christmas',
      cs: 'Měj krásné malé Vánoce',
    },
    options: {
      en: ['Have Yourself a Merry Little Christmas', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Měj krásné malé Vánoce', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_24',
    audioSrc: '/audio/christmas_songs/it_beginning_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'It\'s Beginning to Look a Lot Like Christmas',
      cs: 'Začíná to vypadat jako Vánoce',
    },
    options: {
      en: ['It\'s Beginning to Look a Lot Like Christmas', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Začíná to vypadat jako Vánoce', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_25',
    audioSrc: '/audio/christmas_songs/silver_bells_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Silver Bells',
      cs: 'Stříbrné zvony',
    },
    options: {
      en: ['Silver Bells', 'Jingle Bells', 'Jingle Bell Rock', 'Deck the Halls'],
      cs: ['Stříbrné zvony', 'Jingle Bells', 'Jingle Bell Rock', 'Nazdobme sál'],
    },
    correctIndex: 0,
  },
  // Adding artist variants
  {
    id: 'song_26',
    audioSrc: '/audio/christmas_songs/all_i_want_01.mp3',
    variant: 'artist',
    questionText: {
      en: 'Who performs this song?',
      cs: 'Kdo tuto píseň zpívá?',
    },
    correctAnswer: {
      en: 'Mariah Carey',
      cs: 'Mariah Carey',
    },
    options: {
      en: ['Mariah Carey', 'Wham!', 'Bing Crosby', 'Frank Sinatra'],
      cs: ['Mariah Carey', 'Wham!', 'Bing Crosby', 'Frank Sinatra'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_27',
    audioSrc: '/audio/christmas_songs/last_christmas_01.mp3',
    variant: 'artist',
    questionText: {
      en: 'Who performs this song?',
      cs: 'Kdo tuto píseň zpívá?',
    },
    correctAnswer: {
      en: 'Wham!',
      cs: 'Wham!',
    },
    options: {
      en: ['Wham!', 'Mariah Carey', 'Bing Crosby', 'Frank Sinatra'],
      cs: ['Wham!', 'Mariah Carey', 'Bing Crosby', 'Frank Sinatra'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_28',
    audioSrc: '/audio/christmas_songs/white_christmas_01.mp3',
    variant: 'artist',
    questionText: {
      en: 'Who performs this song?',
      cs: 'Kdo tuto píseň zpívá?',
    },
    correctAnswer: {
      en: 'Bing Crosby',
      cs: 'Bing Crosby',
    },
    options: {
      en: ['Bing Crosby', 'Frank Sinatra', 'Dean Martin', 'Nat King Cole'],
      cs: ['Bing Crosby', 'Frank Sinatra', 'Dean Martin', 'Nat King Cole'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_29',
    audioSrc: '/audio/christmas_songs/let_it_snow_01.mp3',
    variant: 'artist',
    questionText: {
      en: 'Who performs this song?',
      cs: 'Kdo tuto píseň zpívá?',
    },
    correctAnswer: {
      en: 'Dean Martin',
      cs: 'Dean Martin',
    },
    options: {
      en: ['Dean Martin', 'Bing Crosby', 'Frank Sinatra', 'Nat King Cole'],
      cs: ['Dean Martin', 'Bing Crosby', 'Frank Sinatra', 'Nat King Cole'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_30',
    audioSrc: '/audio/christmas_songs/chestnuts_01.mp3',
    variant: 'artist',
    questionText: {
      en: 'Who performs this song?',
      cs: 'Kdo tuto píseň zpívá?',
    },
    correctAnswer: {
      en: 'Nat King Cole',
      cs: 'Nat King Cole',
    },
    options: {
      en: ['Nat King Cole', 'Bing Crosby', 'Dean Martin', 'Frank Sinatra'],
      cs: ['Nat King Cole', 'Bing Crosby', 'Dean Martin', 'Frank Sinatra'],
    },
    correctIndex: 0,
  },
  // Adding movie variants
  {
    id: 'song_31',
    audioSrc: '/audio/christmas_songs/white_christmas_01.mp3',
    variant: 'movie',
    questionText: {
      en: 'Which movie is this song from?',
      cs: 'Z jakého filmu je tato píseň?',
    },
    correctAnswer: {
      en: 'White Christmas',
      cs: 'Bílé Vánoce',
    },
    options: {
      en: ['White Christmas', 'It\'s a Wonderful Life', 'Home Alone', 'Elf'],
      cs: ['Bílé Vánoce', 'Je to báječný život', 'Sám doma', 'Elf'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_32',
    audioSrc: '/audio/christmas_songs/rockin_around_01.mp3',
    variant: 'movie',
    questionText: {
      en: 'Which movie features this song?',
      cs: 'Ve kterém filmu zazní tato píseň?',
    },
    correctAnswer: {
      en: 'Home Alone',
      cs: 'Sám doma',
    },
    options: {
      en: ['Home Alone', 'Elf', 'The Grinch', 'Love Actually'],
      cs: ['Sám doma', 'Elf', 'Grinch', 'Láska nebeská'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_33',
    audioSrc: '/audio/christmas_songs/all_i_want_01.mp3',
    variant: 'movie',
    questionText: {
      en: 'Which movie features this song?',
      cs: 'Ve kterém filmu zazní tato píseň?',
    },
    correctAnswer: {
      en: 'Love Actually',
      cs: 'Láska nebeská',
    },
    options: {
      en: ['Love Actually', 'Home Alone', 'Elf', 'The Grinch'],
      cs: ['Láska nebeská', 'Sám doma', 'Elf', 'Grinch'],
    },
    correctIndex: 0,
  },
  // Adding lyrics variants
  {
    id: 'song_34',
    audioSrc: '/audio/christmas_songs/jingle_bells_01.mp3',
    variant: 'lyrics',
    questionText: {
      en: 'Which song starts with this lyric: "Dashing through the snow"?',
      cs: 'Která píseň začíná textem: "Míříme sněhem"?',
    },
    correctAnswer: {
      en: 'Jingle Bells',
      cs: 'Jingle Bells',
    },
    options: {
      en: ['Jingle Bells', 'Let It Snow', 'Winter Wonderland', 'Frosty the Snowman'],
      cs: ['Jingle Bells', 'Ať sněží', 'Zimní pohádka', 'Sněhulák Frosty'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_35',
    audioSrc: '/audio/christmas_songs/silent_night_01.mp3',
    variant: 'lyrics',
    questionText: {
      en: 'Which song starts with this lyric: "Silent night, holy night"?',
      cs: 'Která píseň začíná textem: "Tichá noc, svatá noc"?',
    },
    correctAnswer: {
      en: 'Silent Night',
      cs: 'Tichá noc',
    },
    options: {
      en: ['Silent Night', 'O Holy Night', 'Away in a Manger', 'The First Noel'],
      cs: ['Tichá noc', 'Ó svatá noc', 'V jesličkách', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  // Adding more songs to reach 50 total
  {
    id: 'song_36',
    audioSrc: '/audio/christmas_songs/carol_bells_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Carol of the Bells',
      cs: 'Koleda zvonů',
    },
    options: {
      en: ['Carol of the Bells', 'Jingle Bells', 'Silver Bells', 'Deck the Halls'],
      cs: ['Koleda zvonů', 'Jingle Bells', 'Stříbrné zvony', 'Nazdobme sál'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_37',
    audioSrc: '/audio/christmas_songs/god_rest_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'God Rest Ye Merry, Gentlemen',
      cs: 'Bůh odpočívej, veselí pánové',
    },
    options: {
      en: ['God Rest Ye Merry, Gentlemen', 'Deck the Halls', 'We Wish You a Merry Christmas', 'The First Noel'],
      cs: ['Bůh odpočívej, veselí pánové', 'Nazdobme sál', 'Přejeme vám veselé Vánoce', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_38',
    audioSrc: '/audio/christmas_songs/good_king_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Good King Wenceslas',
      cs: 'Dobrý král Václav',
    },
    options: {
      en: ['Good King Wenceslas', 'Deck the Halls', 'We Wish You a Merry Christmas', 'The First Noel'],
      cs: ['Dobrý král Václav', 'Nazdobme sál', 'Přejeme vám veselé Vánoce', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_39',
    audioSrc: '/audio/christmas_songs/here_comes_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Here Comes Santa Claus',
      cs: 'Přichází Santa Claus',
    },
    options: {
      en: ['Here Comes Santa Claus', 'Santa Claus Is Coming to Town', 'Jingle Bells', 'Rudolph the Red-Nosed Reindeer'],
      cs: ['Přichází Santa Claus', 'Santa Claus přichází do města', 'Jingle Bells', 'Rudolf s červeným nosem'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_40',
    audioSrc: '/audio/christmas_songs/holly_jolly_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'A Holly Jolly Christmas',
      cs: 'Veselé Vánoce s cesmínou',
    },
    options: {
      en: ['A Holly Jolly Christmas', 'Jingle Bells', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Veselé Vánoce s cesmínou', 'Jingle Bells', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_41',
    audioSrc: '/audio/christmas_songs/little_drummer_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'The Little Drummer Boy',
      cs: 'Malý bubeník',
    },
    options: {
      en: ['The Little Drummer Boy', 'Away in a Manger', 'O Holy Night', 'Silent Night'],
      cs: ['Malý bubeník', 'V jesličkách', 'Ó svatá noc', 'Tichá noc'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_42',
    audioSrc: '/audio/christmas_songs/mistletoe_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Mistletoe',
      cs: 'Jmelí',
    },
    options: {
      en: ['Mistletoe', 'Jingle Bells', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Jmelí', 'Jingle Bells', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_43',
    audioSrc: '/audio/christmas_songs/nutcracker_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Dance of the Sugar Plum Fairy',
      cs: 'Tanec cukrové víly',
    },
    options: {
      en: ['Dance of the Sugar Plum Fairy', 'Carol of the Bells', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Tanec cukrové víly', 'Koleda zvonů', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_44',
    audioSrc: '/audio/christmas_songs/sleigh_ride_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Sleigh Ride',
      cs: 'Jízda na saních',
    },
    options: {
      en: ['Sleigh Ride', 'Jingle Bells', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Jízda na saních', 'Jingle Bells', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_46',
    audioSrc: '/audio/christmas_songs/underneath_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Underneath the Tree',
      cs: 'Pod stromem',
    },
    options: {
      en: ['Underneath the Tree', 'Rockin\' Around the Christmas Tree', 'Jingle Bells', 'Deck the Halls'],
      cs: ['Pod stromem', 'Rockin\' Around the Christmas Tree', 'Jingle Bells', 'Nazdobme sál'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_47',
    audioSrc: '/audio/christmas_songs/wonderful_time_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'It\'s the Most Wonderful Time of the Year',
      cs: 'Je to nejkrásnější čas roku',
    },
    options: {
      en: ['It\'s the Most Wonderful Time of the Year', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Je to nejkrásnější čas roku', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_48',
    audioSrc: '/audio/christmas_songs/blue_christmas_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Blue Christmas',
      cs: 'Modré Vánoce',
    },
    options: {
      en: ['Blue Christmas', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Modré Vánoce', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  // Additional songs from unused audio files
  {
    id: 'song_51',
    audioSrc: '/audio/christmas_songs/angels-we-have-heard-on-high-156732.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Angels We Have Heard on High',
      cs: 'Andělé zpívají na výšinách',
    },
    options: {
      en: ['Angels We Have Heard on High', 'Hark! The Herald Angels Sing', 'O Holy Night', 'Silent Night'],
      cs: ['Andělé zpívají na výšinách', 'Slyšte andělé zpívají', 'Ó svatá noc', 'Tichá noc'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_52',
    audioSrc: '/audio/christmas_songs/ding-dong-merrily-on-high-11635.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Ding Dong Merrily on High',
      cs: 'Ding Dong Merrily on High',
    },
    options: {
      en: ['Ding Dong Merrily on High', 'Jingle Bells', 'Deck the Halls', 'We Wish You a Merry Christmas'],
      cs: ['Ding Dong Merrily on High', 'Jingle Bells', 'Nazdobme sál', 'Přejeme vám veselé Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_53',
    audioSrc: '/audio/christmas_songs/i-saw-three-ships-christmas-bells-129132.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'I Saw Three Ships',
      cs: 'Viděl jsem tři lodě',
    },
    options: {
      en: ['I Saw Three Ships', 'The Twelve Days of Christmas', 'We Three Kings', 'The First Noel'],
      cs: ['Viděl jsem tři lodě', 'Dvanáct dní Vánoc', 'Tři králové', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_54',
    audioSrc: '/audio/christmas_songs/in-the-bleak-midwinter-christmas-carol-concert-grand-piano-9619.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'In the Bleak Midwinter',
      cs: 'V temné zimě',
    },
    options: {
      en: ['In the Bleak Midwinter', 'Silent Night', 'O Holy Night', 'Away in a Manger'],
      cs: ['V temné zimě', 'Tichá noc', 'Ó svatá noc', 'V jesličkách'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_55',
    audioSrc: '/audio/christmas_songs/o-christmas-tree-o-tannenbaum-piano-christmas-carol-1792.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'O Christmas Tree',
      cs: 'Ó vánoční stromečku',
    },
    options: {
      en: ['O Christmas Tree', 'O Holy Night', 'O Come All Ye Faithful', 'Deck the Halls'],
      cs: ['Ó vánoční stromečku', 'Ó svatá noc', 'Pojďte všichni věrní', 'Nazdobme sál'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_56',
    audioSrc: '/audio/christmas_songs/o-come-all-ye-faithful-classical-christmas-piano-music-280770.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'O Come All Ye Faithful',
      cs: 'Pojďte všichni věrní',
    },
    options: {
      en: ['O Come All Ye Faithful', 'O Holy Night', 'O Christmas Tree', 'Silent Night'],
      cs: ['Pojďte všichni věrní', 'Ó svatá noc', 'Ó vánoční stromečku', 'Tichá noc'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_57',
    audioSrc: '/audio/christmas_songs/o-little-town-of-bethlehem-piano-248544.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'O Little Town of Bethlehem',
      cs: 'Ó malé město Betléme',
    },
    options: {
      en: ['O Little Town of Bethlehem', 'Silent Night', 'Away in a Manger', 'The First Noel'],
      cs: ['Ó malé město Betléme', 'Tichá noc', 'V jesličkách', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_58',
    audioSrc: '/audio/christmas_songs/once_royal_david_01.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Once in Royal David\'s City',
      cs: 'Kdysi v královském městě Davidově',
    },
    options: {
      en: ['Once in Royal David\'s City', 'O Little Town of Bethlehem', 'Away in a Manger', 'The First Noel'],
      cs: ['Kdysi v královském městě Davidově', 'Ó malé město Betléme', 'V jesličkách', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_59',
    audioSrc: '/audio/christmas_songs/Santa Baby - Piano Cover & Sheet Music - Piano Mario.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'Santa Baby',
      cs: 'Santa Baby',
    },
    options: {
      en: ['Santa Baby', 'Santa Claus Is Coming to Town', 'Here Comes Santa Claus', 'Jingle Bells'],
      cs: ['Santa Baby', 'Santa Claus přichází do města', 'Přichází Santa Claus', 'Jingle Bells'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_60',
    audioSrc: '/audio/christmas_songs/The Christmas Waltz (Piano Cover) Sam Jennings, Piano - Sam Jennings.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'The Christmas Waltz',
      cs: 'Vánoční valčík',
    },
    options: {
      en: ['The Christmas Waltz', 'White Christmas', 'Let It Snow', 'Winter Wonderland'],
      cs: ['Vánoční valčík', 'Bílé Vánoce', 'Ať sněží', 'Zimní pohádka'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_61',
    audioSrc: '/audio/christmas_songs/we-three-kings-170788.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'We Three Kings',
      cs: 'Tři králové',
    },
    options: {
      en: ['We Three Kings', 'The Twelve Days of Christmas', 'I Saw Three Ships', 'The First Noel'],
      cs: ['Tři králové', 'Dvanáct dní Vánoc', 'Viděl jsem tři lodě', 'První Vánoce'],
    },
    correctIndex: 0,
  },
  {
    id: 'song_62',
    audioSrc: '/audio/christmas_songs/what-child-is-this-196022.mp3',
    variant: 'song_title',
    questionText: {
      en: 'Which song is this?',
      cs: 'Která písnička to je?',
    },
    correctAnswer: {
      en: 'What Child Is This',
      cs: 'Jaké to dítě je',
    },
    options: {
      en: ['What Child Is This', 'Away in a Manger', 'O Little Town of Bethlehem', 'Silent Night'],
      cs: ['Jaké to dítě je', 'V jesličkách', 'Ó malé město Betléme', 'Tichá noc'],
    },
    correctIndex: 0,
  },
];
