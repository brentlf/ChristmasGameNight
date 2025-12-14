export interface TriviaItem {
  id: string;
  question: {
    en: string;
    cs: string;
  };
  options: {
    en: string[];
    cs: string[];
  };
  correctIndex: number; // 0-3
}

export const triviaChristmasPool: TriviaItem[] = [
  {
    id: 'trivia_1',
    question: {
      en: 'What is the name of the reindeer with a red nose?',
      cs: 'Jak se jmenuje sob s červeným nosem?',
    },
    options: {
      en: ['Rudolph', 'Dasher', 'Prancer', 'Blitzen'],
      cs: ['Rudolf', 'Dasher', 'Prancer', 'Blitzen'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_2',
    question: {
      en: 'In which country did the tradition of Christmas trees originate?',
      cs: 'Ve které zemi vznikla tradice vánočních stromků?',
    },
    options: {
      en: ['Germany', 'England', 'France', 'Italy'],
      cs: ['Německo', 'Anglie', 'Francie', 'Itálie'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_3',
    question: {
      en: 'What do people traditionally put on top of a Christmas tree?',
      cs: 'Co lidé tradičně dávají na vrchol vánočního stromku?',
    },
    options: {
      en: ['A star', 'An angel', 'A bow', 'A bell'],
      cs: ['Hvězda', 'Anděl', 'Mašle', 'Zvon'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_4',
    question: {
      en: 'How many gifts did my true love give to me in "The Twelve Days of Christmas"?',
      cs: 'Kolik dárků mi dal/a můj milý/á v písni "Dvanáct dní Vánoc"?',
    },
    options: {
      en: ['364', '365', '366', '360'],
      cs: ['364', '365', '366', '360'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_5',
    question: {
      en: 'What is the main ingredient in traditional eggnog?',
      cs: 'Jaká je hlavní přísada v tradičním eggnog?',
    },
    options: {
      en: ['Eggs', 'Milk', 'Cream', 'Sugar'],
      cs: ['Vejce', 'Mléko', 'Smetana', 'Cukr'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_6',
    question: {
      en: 'What date is Christmas celebrated in most Western countries?',
      cs: 'Které datum se slaví Vánoce ve většině západních zemí?',
    },
    options: {
      en: ['December 25', 'December 24', 'December 26', 'January 1'],
      cs: ['25. prosince', '24. prosince', '26. prosince', '1. ledna'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_7',
    question: {
      en: 'What is the name of the Grinch\'s dog?',
      cs: 'Jak se jmenuje pes Grinche?',
    },
    options: {
      en: ['Max', 'Buddy', 'Rex', 'Charlie'],
      cs: ['Max', 'Buddy', 'Rex', 'Charlie'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_8',
    question: {
      en: 'In "A Christmas Carol", what is the first name of Scrooge?',
      cs: 'V "Vánoční koledě" - jaké je křestní jméno Scrooga?',
    },
    options: {
      en: ['Ebenezer', 'Charles', 'Jacob', 'Bob'],
      cs: ['Ebenezer', 'Charles', 'Jacob', 'Bob'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_9',
    question: {
      en: 'What color are mistletoe berries?',
      cs: 'Jakou barvu mají bobule jmelí?',
    },
    options: {
      en: ['White', 'Red', 'Green', 'Blue'],
      cs: ['Bílá', 'Červená', 'Zelená', 'Modrá'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_10',
    question: {
      en: 'What is the name of the town where "It\'s a Wonderful Life" takes place?',
      cs: 'Jak se jmenuje město, kde se odehrává "Je to báječný život"?',
    },
    options: {
      en: ['Bedford Falls', 'Springfield', 'Pleasantville', 'Hollywood'],
      cs: ['Bedford Falls', 'Springfield', 'Pleasantville', 'Hollywood'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_11',
    question: {
      en: 'How many ghosts visit Scrooge in "A Christmas Carol"?',
      cs: 'Kolik duchů navštíví Scrooga ve "Vánoční koledě"?',
    },
    options: {
      en: ['Four', 'Three', 'Two', 'Five'],
      cs: ['Čtyři', 'Tři', 'Dva', 'Pět'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_12',
    question: {
      en: 'What do people traditionally leave out for Santa Claus?',
      cs: 'Co lidé tradičně nechávají pro Santa Clause?',
    },
    options: {
      en: ['Cookies and milk', 'Carrots and water', 'Cake and juice', 'Candy and soda'],
      cs: ['Sušenky a mléko', 'Mrkev a vodu', 'Dort a džus', 'Bonbony a limonádu'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_13',
    question: {
      en: 'What is the name of the main character in "The Polar Express"?',
      cs: 'Jak se jmenuje hlavní postava v "Polárním expresu"?',
    },
    options: {
      en: ['The Boy', 'Billy', 'Tommy', 'Hero Boy'],
      cs: ['Chlapec', 'Billy', 'Tommy', 'Hrdina'],
    },
    correctIndex: 3,
  },
  {
    id: 'trivia_14',
    question: {
      en: 'In which month does Christmas fall?',
      cs: 'V kterém měsíci jsou Vánoce?',
    },
    options: {
      en: ['December', 'November', 'January', 'February'],
      cs: ['Prosinec', 'Listopad', 'Leden', 'Únor'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_15',
    question: {
      en: 'What is the name of the snowman in "Frozen"?',
      cs: 'Jak se jmenuje sněhulák ve "Frozen"?',
    },
    options: {
      en: ['Olaf', 'Frosty', 'Snowy', 'Ice'],
      cs: ['Olaf', 'Frosty', 'Sněhový', 'Led'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_16',
    question: {
      en: 'What is traditionally eaten for Christmas dinner in the UK?',
      cs: 'Co se tradičně jí na vánoční večeři ve Velké Británii?',
    },
    options: {
      en: ['Turkey', 'Ham', 'Chicken', 'Beef'],
      cs: ['Krocan', 'Šunka', 'Kuře', 'Hovězí'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_17',
    question: {
      en: 'What is the name of the angel in "It\'s a Wonderful Life"?',
      cs: 'Jak se jmenuje anděl v "Je to báječný život"?',
    },
    options: {
      en: ['Clarence', 'Gabriel', 'Michael', 'Raphael'],
      cs: ['Clarence', 'Gabriel', 'Michael', 'Raphael'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_18',
    question: {
      en: 'How many reindeer pull Santa\'s sleigh?',
      cs: 'Kolik sobů táhne Santovy sáně?',
    },
    options: {
      en: ['Nine', 'Eight', 'Ten', 'Twelve'],
      cs: ['Devět', 'Osm', 'Deset', 'Dvanáct'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_19',
    question: {
      en: 'What is the name of the little girl in "Miracle on 34th Street"?',
      cs: 'Jak se jmenuje holčička v "Zázraku na 34. ulici"?',
    },
    options: {
      en: ['Susan', 'Mary', 'Emily', 'Lucy'],
      cs: ['Susan', 'Mary', 'Emily', 'Lucy'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_20',
    question: {
      en: 'What do people traditionally hang on their doors at Christmas?',
      cs: 'Co lidé tradičně věší na dveře o Vánocích?',
    },
    options: {
      en: ['Wreath', 'Garland', 'Bells', 'Lights'],
      cs: ['Věnec', 'Girlanda', 'Zvonky', 'Světla'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_21',
    question: {
      en: 'What is the name of the main character in "Elf"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Elf"?',
    },
    options: {
      en: ['Buddy', 'Charlie', 'Sam', 'Tom'],
      cs: ['Buddy', 'Charlie', 'Sam', 'Tom'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_22',
    question: {
      en: 'What is the traditional Christmas flower?',
      cs: 'Jaká je tradiční vánoční květina?',
    },
    options: {
      en: ['Poinsettia', 'Rose', 'Tulip', 'Daisy'],
      cs: ['Vánoční hvězda', 'Růže', 'Tulipán', 'Sedmikráska'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_23',
    question: {
      en: 'What is the name of the town in "Home Alone"?',
      cs: 'Jak se jmenuje město ve filmu "Sám doma"?',
    },
    options: {
      en: ['Winnetka', 'Chicago', 'New York', 'Boston'],
      cs: ['Winnetka', 'Chicago', 'New York', 'Boston'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_24',
    question: {
      en: 'What is traditionally placed inside a Christmas pudding?',
      cs: 'Co se tradičně dává do vánočního pudinku?',
    },
    options: {
      en: ['A coin', 'A ring', 'A nut', 'A button'],
      cs: ['Mince', 'Prsten', 'Ořech', 'Knoflík'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_25',
    question: {
      en: 'What is the name of the boy who receives a BB gun in "A Christmas Story"?',
      cs: 'Jak se jmenuje chlapec, který dostane vzduchovku ve filmu "Vánoční příběh"?',
    },
    options: {
      en: ['Ralphie', 'Billy', 'Johnny', 'Tommy'],
      cs: ['Ralphie', 'Billy', 'Johnny', 'Tommy'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_26',
    question: {
      en: 'What color is Santa\'s suit?',
      cs: 'Jakou barvu má Santův oblek?',
    },
    options: {
      en: ['Red', 'Blue', 'Green', 'White'],
      cs: ['Červená', 'Modrá', 'Zelená', 'Bílá'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_27',
    question: {
      en: 'What is the name of the reindeer that comes before Dasher?',
      cs: 'Jak se jmenuje sob, který je před Dasherem?',
    },
    options: {
      en: ['None (Dasher is first)', 'Rudolph', 'Prancer', 'Dancer'],
      cs: ['Žádný (Dasher je první)', 'Rudolf', 'Prancer', 'Dancer'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_28',
    question: {
      en: 'What do people traditionally kiss under?',
      cs: 'Pod čím lidé tradičně líbají?',
    },
    options: {
      en: ['Mistletoe', 'Christmas tree', 'Wreath', 'Garland'],
      cs: ['Jmelí', 'Vánoční stromek', 'Věnec', 'Girlanda'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_29',
    question: {
      en: 'What is the name of the main character in "The Nightmare Before Christmas"?',
      cs: 'Jak se jmenuje hlavní postava v "Noční můře před Vánocemi"?',
    },
    options: {
      en: ['Jack Skellington', 'Sally', 'Oogie Boogie', 'Zero'],
      cs: ['Jack Skellington', 'Sally', 'Oogie Boogie', 'Zero'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_30',
    question: {
      en: 'What is traditionally burned in the fireplace on Christmas Eve?',
      cs: 'Co se tradičně pálí v krbu na Štědrý večer?',
    },
    options: {
      en: ['Yule log', 'Candles', 'Incense', 'Paper'],
      cs: ['Vánoční poleno', 'Svíčky', 'Kadidlo', 'Papír'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_31',
    question: {
      en: 'What is the name of the little boy in "A Charlie Brown Christmas"?',
      cs: 'Jak se jmenuje chlapeček v "Vánočním příběhu Charlieho Browna"?',
    },
    options: {
      en: ['Charlie Brown', 'Linus', 'Snoopy', 'Schroeder'],
      cs: ['Charlie Brown', 'Linus', 'Snoopy', 'Schroeder'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_32',
    question: {
      en: 'What is the traditional Christmas drink made with eggs, milk, and spices?',
      cs: 'Jaký je tradiční vánoční nápoj vyrobený z vajec, mléka a koření?',
    },
    options: {
      en: ['Eggnog', 'Hot chocolate', 'Mulled wine', 'Cider'],
      cs: ['Eggnog', 'Horká čokoláda', 'Svařené víno', 'Cider'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_33',
    question: {
      en: 'What is the name of the main character in "How the Grinch Stole Christmas"?',
      cs: 'Jak se jmenuje hlavní postava v "Jak Grinch ukradl Vánoce"?',
    },
    options: {
      en: ['The Grinch', 'Cindy Lou', 'Max', 'Mayor'],
      cs: ['Grinch', 'Cindy Lou', 'Max', 'Starosta'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_34',
    question: {
      en: 'What is traditionally placed on top of a Christmas tree?',
      cs: 'Co se tradičně dává na vrchol vánočního stromku?',
    },
    options: {
      en: ['A star or angel', 'A bow', 'A bell', 'A light'],
      cs: ['Hvězda nebo anděl', 'Mašle', 'Zvon', 'Světlo'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_35',
    question: {
      en: 'What is the name of the town in "The Santa Clause"?',
      cs: 'Jak se jmenuje město ve filmu "Smlouva se Santou"?',
    },
    options: {
      en: ['Lakeview', 'Springfield', 'Bedford', 'Hollywood'],
      cs: ['Lakeview', 'Springfield', 'Bedford', 'Hollywood'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_36',
    question: {
      en: 'What do people traditionally leave for reindeer?',
      cs: 'Co lidé tradičně nechávají pro soby?',
    },
    options: {
      en: ['Carrots', 'Apples', 'Hay', 'Candy'],
      cs: ['Mrkev', 'Jablka', 'Seno', 'Bonbony'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_37',
    question: {
      en: 'What is the name of the main character in "The Holiday"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Prázdniny"?',
    },
    options: {
      en: ['Iris', 'Amanda', 'Graham', 'Miles'],
      cs: ['Iris', 'Amanda', 'Graham', 'Miles'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_38',
    question: {
      en: 'What is traditionally eaten on Christmas morning in many countries?',
      cs: 'Co se tradičně jí o Vánocích ráno v mnoha zemích?',
    },
    options: {
      en: ['Breakfast', 'Brunch', 'Lunch', 'Dinner'],
      cs: ['Snídaně', 'Brunch', 'Oběd', 'Večeře'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_39',
    question: {
      en: 'What is the name of the main character in "Love Actually"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Láska nebeská"?',
    },
    options: {
      en: ['Multiple characters', 'David', 'Jamie', 'Harry'],
      cs: ['Více postav', 'David', 'Jamie', 'Harry'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_40',
    question: {
      en: 'What is traditionally hung by the fireplace for Santa?',
      cs: 'Co se tradičně věší u krbu pro Santa Clause?',
    },
    options: {
      en: ['Stockings', 'Garland', 'Lights', 'Bells'],
      cs: ['Ponožky', 'Girlanda', 'Světla', 'Zvonky'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_41',
    question: {
      en: 'What is the name of the main character in "The Family Stone"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Rodinný kámen"?',
    },
    options: {
      en: ['Everett', 'Sybil', 'Ben', 'Meredith'],
      cs: ['Everett', 'Sybil', 'Ben', 'Meredith'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_42',
    question: {
      en: 'What is traditionally placed inside a Christmas cracker?',
      cs: 'Co se tradičně dává do vánočního bonbonu?',
    },
    options: {
      en: ['A paper hat, joke, and small toy', 'Candy', 'A note', 'Money'],
      cs: ['Papírová čepice, vtip a malá hračka', 'Bonbony', 'Poznámka', 'Peníze'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_43',
    question: {
      en: 'What is the name of the main character in "The Christmas Chronicles"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Vánoční kroniky"?',
    },
    options: {
      en: ['Kate', 'Teddy', 'Santa', 'Claire'],
      cs: ['Kate', 'Teddy', 'Santa', 'Claire'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_44',
    question: {
      en: 'What is traditionally served with Christmas pudding?',
      cs: 'Co se tradičně podává s vánočním pudinkem?',
    },
    options: {
      en: ['Brandy butter or custard', 'Ice cream', 'Whipped cream', 'Chocolate sauce'],
      cs: ['Koňakové máslo nebo krém', 'Zmrzlina', 'Šlehačka', 'Čokoládová omáčka'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_45',
    question: {
      en: 'What is the name of the main character in "The Muppet Christmas Carol"?',
      cs: 'Jak se jmenuje hlavní postava v "Vánoční koledě Muppetů"?',
    },
    options: {
      en: ['Ebenezer Scrooge', 'Kermit', 'Miss Piggy', 'Gonzo'],
      cs: ['Ebenezer Scrooge', 'Kermit', 'Miss Piggy', 'Gonzo'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_46',
    question: {
      en: 'What is traditionally placed on the Christmas table?',
      cs: 'Co se tradičně dává na vánoční stůl?',
    },
    options: {
      en: ['A centerpiece', 'Candles', 'Garland', 'All of the above'],
      cs: ['Středový dekor', 'Svíčky', 'Girlanda', 'Vše výše uvedené'],
    },
    correctIndex: 3,
  },
  {
    id: 'trivia_47',
    question: {
      en: 'What is the name of the main character in "The Nutcracker"?',
      cs: 'Jak se jmenuje hlavní postava v "Louskáčkovi"?',
    },
    options: {
      en: ['Clara', 'Marie', 'Fritz', 'Drosselmeyer'],
      cs: ['Clara', 'Marie', 'Fritz', 'Drosselmeyer'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_48',
    question: {
      en: 'What is traditionally sung on Christmas Eve?',
      cs: 'Co se tradičně zpívá na Štědrý večer?',
    },
    options: {
      en: ['Christmas carols', 'Pop songs', 'Hymns', 'All of the above'],
      cs: ['Vánoční koledy', 'Popové písně', 'Hymny', 'Vše výše uvedené'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_49',
    question: {
      en: 'What is the name of the main character in "A Christmas Story"?',
      cs: 'Jak se jmenuje hlavní postava ve filmu "Vánoční příběh"?',
    },
    options: {
      en: ['Ralphie', 'Randy', 'The Old Man', 'Mother'],
      cs: ['Ralphie', 'Randy', 'Starý muž', 'Matka'],
    },
    correctIndex: 0,
  },
  {
    id: 'trivia_50',
    question: {
      en: 'What is traditionally given as a gift on the first day of Christmas?',
      cs: 'Co se tradičně dává jako dárek první den Vánoc?',
    },
    options: {
      en: ['A partridge in a pear tree', 'Two turtle doves', 'Three French hens', 'Four calling birds'],
      cs: ['Koroptev v hrušce', 'Dvě hrdličky', 'Tři francouzské slepice', 'Čtyři volající ptáci'],
    },
    correctIndex: 0,
  },
];
