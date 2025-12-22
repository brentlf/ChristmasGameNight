export interface FamilyFeudQuestion {
  id: string;
  question: {
    en: string;
    cs: string;
  };
  answers: {
    id: string;
    text: {
      en: string;
      cs: string;
    };
    points: number;
    aliases?: string[]; // Optional aliases for matching
  }[];
}

export const familyFeudChristmasPool: FamilyFeudQuestion[] = [
  {
    id: 'ff_1',
    question: {
      en: 'Name something people put on their Christmas tree.',
      cs: 'Řekněte něco, co lidé dávají na vánoční stromek.',
    },
    answers: [
      { id: 'ff_1_a', text: { en: 'Lights', cs: 'Světla' }, points: 30, aliases: ['Christmas lights', 'Fairy lights', 'String lights'] },
      { id: 'ff_1_b', text: { en: 'Ornaments', cs: 'Ozdoby' }, points: 25, aliases: ['Baubles', 'Decorations'] },
      { id: 'ff_1_c', text: { en: 'Star', cs: 'Hvězda' }, points: 20, aliases: ['Star on top', 'Tree topper'] },
      { id: 'ff_1_d', text: { en: 'Tinsel', cs: 'Řetězy' }, points: 15, aliases: ['Garland', 'Icicles'] },
      { id: 'ff_1_e', text: { en: 'Candy canes', cs: 'Cukrové hole' }, points: 10, aliases: ['Candy sticks'] },
    ],
  },
  {
    id: 'ff_2',
    question: {
      en: 'Name a popular Christmas movie.',
      cs: 'Řekněte název populárního vánočního filmu.',
    },
    answers: [
      { id: 'ff_2_a', text: { en: 'Home Alone', cs: 'Sám doma' }, points: 35, aliases: ['Home Alone 1', 'Kevin McCallister'] },
      { id: 'ff_2_b', text: { en: 'Elf', cs: 'Elf' }, points: 25, aliases: ['Buddy the Elf'] },
      { id: 'ff_2_c', text: { en: 'The Grinch', cs: 'Grinch' }, points: 20, aliases: ['How the Grinch Stole Christmas'] },
      { id: 'ff_2_d', text: { en: 'A Christmas Story', cs: 'Vánoční příběh' }, points: 12, aliases: ['Ralphie'] },
      { id: 'ff_2_e', text: { en: 'It\'s a Wonderful Life', cs: 'To je báječný život' }, points: 8, aliases: ['George Bailey'] },
    ],
  },
  {
    id: 'ff_3',
    question: {
      en: 'Name something people leave out for Santa.',
      cs: 'Řekněte něco, co lidé nechávají pro Santu.',
    },
    answers: [
      { id: 'ff_3_a', text: { en: 'Cookies', cs: 'Sušenky' }, points: 40, aliases: ['Christmas cookies', 'Biscuits'] },
      { id: 'ff_3_b', text: { en: 'Milk', cs: 'Mléko' }, points: 30, aliases: [] },
      { id: 'ff_3_c', text: { en: 'Carrots', cs: 'Mrkev' }, points: 15, aliases: ['Carrot for reindeer'] },
      { id: 'ff_3_d', text: { en: 'Note', cs: 'Dopis' }, points: 10, aliases: ['Letter', 'Wish list'] },
      { id: 'ff_3_e', text: { en: 'Candy', cs: 'Bonbóny' }, points: 5, aliases: ['Sweets'] },
    ],
  },
  {
    id: 'ff_4',
    question: {
      en: 'Name a Christmas song that everyone knows.',
      cs: 'Řekněte vánoční písničku, kterou každý zná.',
    },
    answers: [
      { id: 'ff_4_a', text: { en: 'Jingle Bells', cs: 'Rolničky' }, points: 35, aliases: ['Jingle Bell Rock'] },
      { id: 'ff_4_b', text: { en: 'Silent Night', cs: 'Tichá noc' }, points: 25, aliases: ['Stille Nacht'] },
      { id: 'ff_4_c', text: { en: 'White Christmas', cs: 'Bílé Vánoce' }, points: 20, aliases: ['I\'m Dreaming of a White Christmas'] },
      { id: 'ff_4_d', text: { en: 'All I Want for Christmas Is You', cs: 'Všechno, co chci k Vánocům, jsi ty' }, points: 12, aliases: ['Mariah Carey'] },
      { id: 'ff_4_e', text: { en: 'Rudolph the Red-Nosed Reindeer', cs: 'Rudolf s červeným nosem' }, points: 8, aliases: ['Rudolph'] },
    ],
  },
  {
    id: 'ff_5',
    question: {
      en: 'Name something people hang on their front door at Christmas.',
      cs: 'Řekněte něco, co lidé věší na vchodové dveře o Vánocích.',
    },
    answers: [
      { id: 'ff_5_a', text: { en: 'Wreath', cs: 'Věnec' }, points: 40, aliases: ['Christmas wreath', 'Door wreath'] },
      { id: 'ff_5_b', text: { en: 'Mistletoe', cs: 'Jmelí' }, points: 25, aliases: [] },
      { id: 'ff_5_c', text: { en: 'Garland', cs: 'Girlanda' }, points: 18, aliases: ['Christmas garland'] },
      { id: 'ff_5_d', text: { en: 'Bells', cs: 'Zvonky' }, points: 12, aliases: ['Door bells'] },
      { id: 'ff_5_e', text: { en: 'Stocking', cs: 'Ponožka' }, points: 5, aliases: ['Christmas stocking'] },
    ],
  },
  {
    id: 'ff_6',
    question: {
      en: 'Name a traditional Christmas food.',
      cs: 'Řekněte tradiční vánoční jídlo.',
    },
    answers: [
      { id: 'ff_6_a', text: { en: 'Turkey', cs: 'Krocan' }, points: 30, aliases: ['Roast turkey'] },
      { id: 'ff_6_b', text: { en: 'Ham', cs: 'Šunka' }, points: 25, aliases: ['Christmas ham'] },
      { id: 'ff_6_c', text: { en: 'Gingerbread', cs: 'Perník' }, points: 20, aliases: ['Gingerbread cookies', 'Gingerbread house'] },
      { id: 'ff_6_d', text: { en: 'Eggnog', cs: 'Vaječný koňak' }, points: 15, aliases: ['Nog'] },
      { id: 'ff_6_e', text: { en: 'Fruitcake', cs: 'Ovocný koláč' }, points: 10, aliases: ['Christmas cake'] },
    ],
  },
  {
    id: 'ff_7',
    question: {
      en: 'Name something people do on Christmas morning.',
      cs: 'Řekněte něco, co lidé dělají o Vánočním ránu.',
    },
    answers: [
      { id: 'ff_7_a', text: { en: 'Open presents', cs: 'Rozbalují dárky' }, points: 40, aliases: ['Open gifts', 'Unwrap presents'] },
      { id: 'ff_7_b', text: { en: 'Eat breakfast', cs: 'Snídají' }, points: 25, aliases: ['Have breakfast'] },
      { id: 'ff_7_c', text: { en: 'Watch kids play', cs: 'Sledují děti hrát' }, points: 18, aliases: ['Watch children'] },
      { id: 'ff_7_d', text: { en: 'Take photos', cs: 'Fotí' }, points: 12, aliases: ['Take pictures'] },
      { id: 'ff_7_e', text: { en: 'Call family', cs: 'Volají rodině' }, points: 5, aliases: ['Phone family'] },
    ],
  },
  {
    id: 'ff_8',
    question: {
      en: 'Name a color associated with Christmas.',
      cs: 'Řekněte barvu spojenou s Vánocemi.',
    },
    answers: [
      { id: 'ff_8_a', text: { en: 'Red', cs: 'Červená' }, points: 35, aliases: [] },
      { id: 'ff_8_b', text: { en: 'Green', cs: 'Zelená' }, points: 30, aliases: [] },
      { id: 'ff_8_c', text: { en: 'Gold', cs: 'Zlatá' }, points: 20, aliases: ['Yellow'] },
      { id: 'ff_8_d', text: { en: 'White', cs: 'Bílá' }, points: 10, aliases: ['Snow white'] },
      { id: 'ff_8_e', text: { en: 'Silver', cs: 'Stříbrná' }, points: 5, aliases: [] },
    ],
  },
  {
    id: 'ff_9',
    question: {
      en: 'Name something people build out of snow.',
      cs: 'Řekněte něco, co lidé staví ze sněhu.',
    },
    answers: [
      { id: 'ff_9_a', text: { en: 'Snowman', cs: 'Sněhulák' }, points: 45, aliases: ['Frosty', 'Snow person'] },
      { id: 'ff_9_b', text: { en: 'Snow fort', cs: 'Sněhová pevnost' }, points: 25, aliases: ['Snow castle', 'Igloo'] },
      { id: 'ff_9_c', text: { en: 'Snow angel', cs: 'Sněhový anděl' }, points: 18, aliases: [] },
      { id: 'ff_9_d', text: { en: 'Snowball', cs: 'Sněhová koule' }, points: 8, aliases: [] },
      { id: 'ff_9_e', text: { en: 'Sled', cs: 'Sáně' }, points: 4, aliases: ['Sled hill', 'Snow slide'] },
    ],
  },
  {
    id: 'ff_10',
    question: {
      en: 'Name a place where people go Christmas shopping.',
      cs: 'Řekněte místo, kam lidé chodí na vánoční nákupy.',
    },
    answers: [
      { id: 'ff_10_a', text: { en: 'Mall', cs: 'Nákupní centrum' }, points: 35, aliases: ['Shopping mall', 'Shopping center'] },
      { id: 'ff_10_b', text: { en: 'Online', cs: 'Online' }, points: 28, aliases: ['Internet', 'Amazon', 'E-commerce'] },
      { id: 'ff_10_c', text: { en: 'Department store', cs: 'Obchodní dům' }, points: 20, aliases: ['Store', 'Shop'] },
      { id: 'ff_10_d', text: { en: 'Christmas market', cs: 'Vánoční trh' }, points: 12, aliases: ['Holiday market'] },
      { id: 'ff_10_e', text: { en: 'Toy store', cs: 'Hračkářství' }, points: 5, aliases: ['Toys R Us'] },
    ],
  },
  {
    id: 'ff_11',
    question: {
      en: 'Name something people wrap at Christmas.',
      cs: 'Řekněte něco, co lidé balí o Vánocích.',
    },
    answers: [
      { id: 'ff_11_a', text: { en: 'Presents', cs: 'Dárky' }, points: 50, aliases: ['Gifts', 'Presents for family'] },
      { id: 'ff_11_b', text: { en: 'Gift boxes', cs: 'Dárkové krabice' }, points: 25, aliases: ['Boxes'] },
      { id: 'ff_11_c', text: { en: 'Food', cs: 'Jídlo' }, points: 15, aliases: ['Christmas food'] },
      { id: 'ff_11_d', text: { en: 'Ornaments', cs: 'Ozdoby' }, points: 7, aliases: [] },
      { id: 'ff_11_e', text: { en: 'Themselves', cs: 'Sami sebe' }, points: 3, aliases: ['In scarves'] },
    ],
  },
  {
    id: 'ff_12',
    question: {
      en: 'Name a Christmas decoration that lights up.',
      cs: 'Řekněte vánoční dekoraci, která svítí.',
    },
    answers: [
      { id: 'ff_12_a', text: { en: 'Christmas lights', cs: 'Vánoční světla' }, points: 40, aliases: ['String lights', 'Fairy lights', 'Lights'] },
      { id: 'ff_12_b', text: { en: 'Candles', cs: 'Svíčky' }, points: 30, aliases: ['Candle'] },
      { id: 'ff_12_c', text: { en: 'Star', cs: 'Hvězda' }, points: 18, aliases: ['Tree topper', 'Star on tree'] },
      { id: 'ff_12_d', text: { en: 'Luminaries', cs: 'Luminárie' }, points: 8, aliases: ['Paper lanterns'] },
      { id: 'ff_12_e', text: { en: 'Fireplace', cs: 'Krb' }, points: 4, aliases: ['Fire'] },
    ],
  },
  {
    id: 'ff_13',
    question: {
      en: 'Name something people drink at Christmas.',
      cs: 'Řekněte něco, co lidé pijí o Vánocích.',
    },
    answers: [
      { id: 'ff_13_a', text: { en: 'Eggnog', cs: 'Vaječný koňak' }, points: 35, aliases: ['Nog'] },
      { id: 'ff_13_b', text: { en: 'Hot chocolate', cs: 'Horká čokoláda' }, points: 30, aliases: ['Hot cocoa', 'Cocoa'] },
      { id: 'ff_13_c', text: { en: 'Mulled wine', cs: 'Svařené víno' }, points: 20, aliases: ['Glühwein', 'Spiced wine'] },
      { id: 'ff_13_d', text: { en: 'Cider', cs: 'Mošt' }, points: 10, aliases: ['Apple cider', 'Hot cider'] },
      { id: 'ff_13_e', text: { en: 'Coffee', cs: 'Káva' }, points: 5, aliases: ['Christmas coffee'] },
    ],
  },
  {
    id: 'ff_14',
    question: {
      en: 'Name something people send at Christmas.',
      cs: 'Řekněte něco, co lidé posílají o Vánocích.',
    },
    answers: [
      { id: 'ff_14_a', text: { en: 'Christmas cards', cs: 'Vánoční přání' }, points: 45, aliases: ['Cards', 'Greeting cards'] },
      { id: 'ff_14_b', text: { en: 'Gifts', cs: 'Dárky' }, points: 30, aliases: ['Presents', 'Packages'] },
      { id: 'ff_14_c', text: { en: 'Letters', cs: 'Dopisy' }, points: 15, aliases: ['Christmas letters'] },
      { id: 'ff_14_d', text: { en: 'Photos', cs: 'Fotky' }, points: 7, aliases: ['Family photos'] },
      { id: 'ff_14_e', text: { en: 'Emails', cs: 'E-maily' }, points: 3, aliases: ['E-cards'] },
    ],
  },
  {
    id: 'ff_15',
    question: {
      en: 'Name a Christmas character.',
      cs: 'Řekněte vánoční postavu.',
    },
    answers: [
      { id: 'ff_15_a', text: { en: 'Santa Claus', cs: 'Santa Claus' }, points: 40, aliases: ['Santa', 'Father Christmas', 'St. Nick'] },
      { id: 'ff_15_b', text: { en: 'Rudolph', cs: 'Rudolf' }, points: 25, aliases: ['Rudolph the Red-Nosed Reindeer'] },
      { id: 'ff_15_c', text: { en: 'Elf', cs: 'Elf' }, points: 20, aliases: ['Christmas elf', 'Santa\'s elf'] },
      { id: 'ff_15_d', text: { en: 'Grinch', cs: 'Grinch' }, points: 10, aliases: ['The Grinch'] },
      { id: 'ff_15_e', text: { en: 'Frosty', cs: 'Frosty' }, points: 5, aliases: ['Frosty the Snowman'] },
    ],
  },
  {
    id: 'ff_16',
    question: {
      en: 'Name something people put in a stocking.',
      cs: 'Řekněte něco, co lidé dávají do vánoční ponožky.',
    },
    answers: [
      { id: 'ff_16_a', text: { en: 'Candy', cs: 'Bonbóny' }, points: 35, aliases: ['Sweets', 'Chocolate'] },
      { id: 'ff_16_b', text: { en: 'Small toys', cs: 'Malé hračky' }, points: 28, aliases: ['Toys', 'Little toys'] },
      { id: 'ff_16_c', text: { en: 'Oranges', cs: 'Pomeranče' }, points: 20, aliases: ['Orange', 'Fruit'] },
      { id: 'ff_16_d', text: { en: 'Coins', cs: 'Mince' }, points: 12, aliases: ['Money', 'Change'] },
      { id: 'ff_16_e', text: { en: 'Socks', cs: 'Ponožky' }, points: 5, aliases: ['New socks'] },
    ],
  },
  {
    id: 'ff_17',
    question: {
      en: 'Name a Christmas activity for kids.',
      cs: 'Řekněte vánoční aktivitu pro děti.',
    },
    answers: [
      { id: 'ff_17_a', text: { en: 'Making cookies', cs: 'Pečení sušenek' }, points: 30, aliases: ['Baking cookies', 'Cookie decorating'] },
      { id: 'ff_17_b', text: { en: 'Writing to Santa', cs: 'Psaní Santovi' }, points: 25, aliases: ['Santa letter'] },
      { id: 'ff_17_c', text: { en: 'Decorating tree', cs: 'Ozdobování stromku' }, points: 22, aliases: ['Tree decorating'] },
      { id: 'ff_17_d', text: { en: 'Singing carols', cs: 'Zpívání koled' }, points: 15, aliases: ['Caroling'] },
      { id: 'ff_17_e', text: { en: 'Watching movies', cs: 'Sledování filmů' }, points: 8, aliases: ['Christmas movies'] },
    ],
  },
  {
    id: 'ff_18',
    question: {
      en: 'Name something people wear at Christmas.',
      cs: 'Řekněte něco, co lidé nosí o Vánocích.',
    },
    answers: [
      { id: 'ff_18_a', text: { en: 'Ugly sweater', cs: 'Ošklivý svetr' }, points: 40, aliases: ['Christmas sweater', 'Holiday sweater'] },
      { id: 'ff_18_b', text: { en: 'Santa hat', cs: 'Santova čepice' }, points: 28, aliases: ['Red hat', 'Christmas hat'] },
      { id: 'ff_18_c', text: { en: 'Red clothes', cs: 'Červené oblečení' }, points: 18, aliases: ['Red outfit'] },
      { id: 'ff_18_d', text: { en: 'Reindeer antlers', cs: 'Sobí parohy' }, points: 10, aliases: ['Antlers headband'] },
      { id: 'ff_18_e', text: { en: 'Elf costume', cs: 'Elfí kostým' }, points: 4, aliases: ['Elf outfit'] },
    ],
  },
  {
    id: 'ff_19',
    question: {
      en: 'Name something people do on Christmas Eve.',
      cs: 'Řekněte něco, co lidé dělají na Štědrý večer.',
    },
    answers: [
      { id: 'ff_19_a', text: { en: 'Open presents', cs: 'Rozbalují dárky' }, points: 35, aliases: ['Open gifts', 'Unwrap'] },
      { id: 'ff_19_b', text: { en: 'Have dinner', cs: 'Večeří' }, points: 30, aliases: ['Eat dinner', 'Christmas dinner'] },
      { id: 'ff_19_c', text: { en: 'Go to church', cs: 'Jdou do kostela' }, points: 20, aliases: ['Church service', 'Midnight mass'] },
      { id: 'ff_19_d', text: { en: 'Watch movies', cs: 'Sledují filmy' }, points: 10, aliases: ['Christmas movies'] },
      { id: 'ff_19_e', text: { en: 'Sing carols', cs: 'Zpívají koledy' }, points: 5, aliases: ['Caroling'] },
    ],
  },
  {
    id: 'ff_20',
    question: {
      en: 'Name something that makes a sound at Christmas.',
      cs: 'Řekněte něco, co vydává zvuk o Vánocích.',
    },
    answers: [
      { id: 'ff_20_a', text: { en: 'Bells', cs: 'Zvonky' }, points: 40, aliases: ['Jingle bells', 'Christmas bells'] },
      { id: 'ff_20_b', text: { en: 'Music', cs: 'Hudba' }, points: 28, aliases: ['Christmas music', 'Carols'] },
      { id: 'ff_20_c', text: { en: 'Sleigh', cs: 'Sáně' }, points: 18, aliases: ['Sleigh bells'] },
      { id: 'ff_20_d', text: { en: 'Fireplace', cs: 'Krb' }, points: 10, aliases: ['Crackling fire'] },
      { id: 'ff_20_e', text: { en: 'Wrapping paper', cs: 'Balicí papír' }, points: 4, aliases: ['Rustling paper'] },
    ],
  },
  {
    id: 'ff_21',
    question: {
      en: 'Name something people put on their Christmas dinner table.',
      cs: 'Řekněte něco, co lidé dávají na vánoční stůl.',
    },
    answers: [
      { id: 'ff_21_a', text: { en: 'Candles', cs: 'Svíčky' }, points: 35, aliases: ['Candle'] },
      { id: 'ff_21_b', text: { en: 'Centerpiece', cs: 'Středový dekor' }, points: 28, aliases: ['Table decoration'] },
      { id: 'ff_21_c', text: { en: 'Tablecloth', cs: 'Ubrus' }, points: 20, aliases: ['Cloth'] },
      { id: 'ff_21_d', text: { en: 'Napkins', cs: 'Ubrousky' }, points: 12, aliases: ['Christmas napkins'] },
      { id: 'ff_21_e', text: { en: 'Place cards', cs: 'Jmenovky' }, points: 5, aliases: ['Name cards'] },
    ],
  },
  {
    id: 'ff_22',
    question: {
      en: 'Name a Christmas tradition.',
      cs: 'Řekněte vánoční tradici.',
    },
    answers: [
      { id: 'ff_22_a', text: { en: 'Opening presents', cs: 'Rozbalování dárků' }, points: 30, aliases: ['Gift exchange'] },
      { id: 'ff_22_b', text: { en: 'Decorating tree', cs: 'Ozdobování stromku' }, points: 25, aliases: ['Tree decorating'] },
      { id: 'ff_22_c', text: { en: 'Singing carols', cs: 'Zpívání koled' }, points: 22, aliases: ['Caroling'] },
      { id: 'ff_22_d', text: { en: 'Baking cookies', cs: 'Pečení sušenek' }, points: 15, aliases: ['Making cookies'] },
      { id: 'ff_22_e', text: { en: 'Watching movies', cs: 'Sledování filmů' }, points: 8, aliases: ['Christmas movie marathon'] },
    ],
  },
  {
    id: 'ff_23',
    question: {
      en: 'Name something people hang on their Christmas tree.',
      cs: 'Řekněte něco, co lidé věší na vánoční stromek.',
    },
    answers: [
      { id: 'ff_23_a', text: { en: 'Ornaments', cs: 'Ozdoby' }, points: 35, aliases: ['Baubles', 'Decorations'] },
      { id: 'ff_23_b', text: { en: 'Lights', cs: 'Světla' }, points: 28, aliases: ['Christmas lights'] },
      { id: 'ff_23_c', text: { en: 'Tinsel', cs: 'Řetězy' }, points: 20, aliases: ['Garland'] },
      { id: 'ff_23_d', text: { en: 'Candy canes', cs: 'Cukrové hole' }, points: 12, aliases: [] },
      { id: 'ff_23_e', text: { en: 'Angels', cs: 'Andělé' }, points: 5, aliases: ['Angel ornaments'] },
    ],
  },
  {
    id: 'ff_24',
    question: {
      en: 'Name something people do to prepare for Christmas.',
      cs: 'Řekněte něco, co lidé dělají, aby se připravili na Vánoce.',
    },
    answers: [
      { id: 'ff_24_a', text: { en: 'Shop for gifts', cs: 'Nakupují dárky' }, points: 35, aliases: ['Shopping', 'Buy presents'] },
      { id: 'ff_24_b', text: { en: 'Decorate', cs: 'Ozdobují' }, points: 28, aliases: ['Decorate house', 'Put up decorations'] },
      { id: 'ff_24_c', text: { en: 'Bake', cs: 'Pečou' }, points: 20, aliases: ['Bake cookies', 'Baking'] },
      { id: 'ff_24_d', text: { en: 'Wrap presents', cs: 'Balí dárky' }, points: 12, aliases: ['Gift wrapping'] },
      { id: 'ff_24_e', text: { en: 'Send cards', cs: 'Posílají přání' }, points: 5, aliases: ['Mail cards'] },
    ],
  },
  {
    id: 'ff_25',
    question: {
      en: 'Name something people see in a nativity scene.',
      cs: 'Řekněte něco, co lidé vidí v betlému.',
    },
    answers: [
      { id: 'ff_25_a', text: { en: 'Baby Jesus', cs: 'Ježíšek' }, points: 40, aliases: ['Jesus', 'Christ child'] },
      { id: 'ff_25_b', text: { en: 'Mary', cs: 'Marie' }, points: 25, aliases: ['Virgin Mary'] },
      { id: 'ff_25_c', text: { en: 'Joseph', cs: 'Josef' }, points: 20, aliases: ['St. Joseph'] },
      { id: 'ff_25_d', text: { en: 'Animals', cs: 'Zvířata' }, points: 10, aliases: ['Sheep', 'Donkey', 'Ox'] },
      { id: 'ff_25_e', text: { en: 'Three Wise Men', cs: 'Tři králové' }, points: 5, aliases: ['Magi', 'Kings'] },
    ],
  },
  {
    id: 'ff_26',
    question: {
      en: 'Name something people put in hot chocolate.',
      cs: 'Řekněte něco, co lidé dávají do horké čokolády.',
    },
    answers: [
      { id: 'ff_26_a', text: { en: 'Marshmallows', cs: 'Marshmallows' }, points: 45, aliases: ['Marshmallow'] },
      { id: 'ff_26_b', text: { en: 'Whipped cream', cs: 'Šlehačka' }, points: 28, aliases: ['Cream'] },
      { id: 'ff_26_c', text: { en: 'Cinnamon', cs: 'Skořice' }, points: 18, aliases: ['Cinnamon stick'] },
      { id: 'ff_26_d', text: { en: 'Candy cane', cs: 'Cukrová hůl' }, points: 7, aliases: ['Peppermint stick'] },
      { id: 'ff_26_e', text: { en: 'Chocolate chips', cs: 'Čokoládové kousky' }, points: 2, aliases: [] },
    ],
  },
  {
    id: 'ff_27',
    question: {
      en: 'Name something people do when it snows at Christmas.',
      cs: 'Řekněte něco, co lidé dělají, když o Vánocích sněží.',
    },
    answers: [
      { id: 'ff_27_a', text: { en: 'Build snowman', cs: 'Staví sněhuláka' }, points: 35, aliases: ['Make snowman'] },
      { id: 'ff_27_b', text: { en: 'Go sledding', cs: 'Jedou na saních' }, points: 28, aliases: ['Sled', 'Toboggan'] },
      { id: 'ff_27_c', text: { en: 'Have snowball fight', cs: 'Vedou koulovačku' }, points: 22, aliases: ['Snowball war'] },
      { id: 'ff_27_d', text: { en: 'Take photos', cs: 'Fotí' }, points: 12, aliases: ['Take pictures'] },
      { id: 'ff_27_e', text: { en: 'Shovel', cs: 'Hrabou' }, points: 3, aliases: ['Shovel snow'] },
    ],
  },
  {
    id: 'ff_28',
    question: {
      en: 'Name something people put on top of a Christmas tree.',
      cs: 'Řekněte něco, co lidé dávají na vrchol vánočního stromku.',
    },
    answers: [
      { id: 'ff_28_a', text: { en: 'Star', cs: 'Hvězda' }, points: 45, aliases: ['Christmas star'] },
      { id: 'ff_28_b', text: { en: 'Angel', cs: 'Anděl' }, points: 35, aliases: ['Christmas angel'] },
      { id: 'ff_28_c', text: { en: 'Bow', cs: 'Mašle' }, points: 12, aliases: ['Ribbon bow'] },
      { id: 'ff_28_d', text: { en: 'Santa', cs: 'Santa' }, points: 5, aliases: ['Santa figure'] },
      { id: 'ff_28_e', text: { en: 'Snowflake', cs: 'Sněhová vločka' }, points: 3, aliases: [] },
    ],
  },
  {
    id: 'ff_29',
    question: {
      en: 'Name something people give as a Christmas gift.',
      cs: 'Řekněte něco, co lidé dávají jako vánoční dárek.',
    },
    answers: [
      { id: 'ff_29_a', text: { en: 'Toys', cs: 'Hračky' }, points: 30, aliases: ['Toy'] },
      { id: 'ff_29_b', text: { en: 'Clothes', cs: 'Oblečení' }, points: 25, aliases: ['Clothing'] },
      { id: 'ff_29_c', text: { en: 'Gift cards', cs: 'Dárkové karty' }, points: 20, aliases: ['Gift certificate'] },
      { id: 'ff_29_d', text: { en: 'Books', cs: 'Knihy' }, points: 15, aliases: ['Book'] },
      { id: 'ff_29_e', text: { en: 'Electronics', cs: 'Elektronika' }, points: 10, aliases: ['Gadgets', 'Tech'] },
    ],
  },
  {
    id: 'ff_30',
    question: {
      en: 'Name something people say at Christmas.',
      cs: 'Řekněte něco, co lidé říkají o Vánocích.',
    },
    answers: [
      { id: 'ff_30_a', text: { en: 'Merry Christmas', cs: 'Veselé Vánoce' }, points: 50, aliases: ['Happy Christmas'] },
      { id: 'ff_30_b', text: { en: 'Happy Holidays', cs: 'Šťastné svátky' }, points: 25, aliases: ['Happy holiday'] },
      { id: 'ff_30_c', text: { en: 'Ho ho ho', cs: 'Ho ho ho' }, points: 15, aliases: ['Ho ho ho ho'] },
      { id: 'ff_30_d', text: { en: 'Thank you', cs: 'Děkuji' }, points: 7, aliases: ['Thanks'] },
      { id: 'ff_30_e', text: { en: 'Peace on Earth', cs: 'Mír na zemi' }, points: 3, aliases: [] },
    ],
  },
];



