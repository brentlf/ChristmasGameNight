export type Language = 'en' | 'cs';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing
    'landing.title': 'Christmas Game Night',
    'landing.subtitle': 'Family Game Show',
    'landing.selectLanguage': 'Select Language',
    'landing.createRoom': 'Create Room',
    'landing.joinRoom': 'Join Room',
    
    // Room Creation
    'create.title': 'Create Game Room',
    'create.subtitle': 'Create a race room, then put the TV view on a big screen.',
    'create.roomName': 'Room Name',
    'create.roomNamePlaceholder': 'Family Christmas 2024',
    'create.maxPlayers': 'Max Players',
    'create.pinEnabled': 'Enable Room PIN',
    'create.pinPlaceholder': '4 digits',
    'create.selectGames': 'Select Games (3-5)',
    'create.dragToReorder': 'Drag to reorder',
    'create.roomNameRequired': 'Room name is required',
    'create.pinInvalid': 'PIN must be 4 digits',
    'create.badge': 'Host a holiday race',
    'create.badgeSub': 'TV + phones',
    'create.raceSettings': 'Race settings',
    'create.difficulty': 'Difficulty',
    'create.difficultyHelp': 'Affects some question/puzzle strictness (future-friendly).',
    'create.allowSkips': 'Allow skips',
    'create.eventsEnabled': 'Event feed on TV',
    'create.eventsHelp': 'Shows join + stage-complete updates on the TV hub.',
    'create.createRoom': 'Create Room',
    
    // Join
    'join.title': 'Join Room',
    'join.enterCode': 'Enter Room Code',
    'join.codePlaceholder': 'ABCD',
    'join.enterPin': 'Enter PIN (if required)',
    'join.pinPlaceholder': '1234',
    'join.join': 'Join',
    'join.invalidCode': 'Invalid room code',
    'join.wrongPin': 'Wrong PIN',
    'join.roomFull': 'Room is full',
    
    // Player
    'player.enterName': 'Enter Your Name',
    'player.namePlaceholder': 'Your name',
    'player.selectAvatar': 'Select Avatar',
    'player.join': 'Join Game',
    'player.nameRequired': 'Name is required',
    'player.nameTaken': 'Name already taken',
    'player.joined': 'Joined room!',
    'player.setup': 'Player setup',
    'player.setupSubtitle': 'Pick a name + avatar — then you’re ready to race.',
    'player.openTv': 'Open TV View',
    
    // Games
    'game.amazingRace': 'Amazing Race',
    'game.festiveDash': 'Festive Dash',
    'game.triviaBlitz': 'Trivia Blitz',
    'game.emojiMovie': 'Emoji Movie Guess',
    'game.secretMissions': 'Secret Missions',
    'game.wouldYouRather': 'Would You Rather',
    
    // Common
    'common.start': 'Start',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.score': 'Score',
    'common.leaderboard': 'Leaderboard',
    'common.waiting': 'Waiting...',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.close': 'Close',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    
    // Controller
    'controller.title': 'Control Panel',
    'controller.startGame': 'Start Game',
    'controller.nextRound': 'Next Round',
    'controller.previousRound': 'Previous Round',
    'controller.endGame': 'End Game',
    'controller.passController': 'Pass Controller',
    'controller.startRace': 'Start Race',
    'controller.endRace': 'End Race',
    'controller.resetRoom': 'Reset Room',
    
    // TV
    'tv.roomCode': 'Room Code',
    'tv.scanToJoin': 'Scan to Join',
    'tv.players': 'Players',
    'tv.waitingForController': 'Waiting for controller...',
    'tv.gameStarting': 'Game Starting...',
    'tv.raceStatus': 'Race Status',
    'tv.status': 'Status',
    'tv.progressSummary': 'Completed',
    'tv.lead': 'Lead',
    'tv.finished': 'Finished!',
    'tv.eventFeed': 'Live event feed',
    'tv.noEvents': 'No events yet.',
    'tv.eventJoined': 'joined',
    'tv.eventCompleted': 'completed',
    'tv.raceMap': 'Race map',
    'tv.track': 'Track',
    
    // Amazing Race
    'race.stage': 'Stage',
    'race.currentStage': 'Current Stage',
    'race.complete': 'Complete',
    'race.hint': 'Hint',
    'race.correct': 'Correct!',
    'race.incorrect': 'Incorrect',
    'race.progress': 'Progress',
    'race.rules': 'Rules',
    'race.typeAnswer': 'Type your answer…',
    'race.showHint': 'Show hint',
    'race.hideHint': 'Hide hint',
    'race.locked': 'Locked',
    'race.question': 'Question',
    'race.emojiProgress': 'Solved',
    'race.photoOptional': 'Optional photo upload (+5 bonus)',
    'race.photoBonusNote': 'AI will validate your photo. If it matches the task, you get a bonus!',
    'race.validatePhoto': 'Validate photo (+5)',
    'race.validatingPhoto': 'AI is checking your photo...',
    'race.photoValidated': 'Photo validated!',
    'race.photoInvalid': 'Photo does not match',
    'race.markDone': 'Mark done',
    'race.markDoneNoPhoto': 'Done (no photo)',
    'race.photoSelected': 'Selected photo',
    'race.completed': 'Completed!',
    'race.startMyRace': 'Start my race',
    'race.lobbyPrompt': 'When you’re ready, start your own race. Everyone progresses independently.',
    'race.openTv': 'TV View',
    'race.tv': 'TV',
    'race.finishedTitle': 'You finished!',
    'race.finishedSubtitle': 'Great job — check the TV for the live podium.',
    'race.backToTv': 'Back to TV',
    'race.viewResults': 'View Results',
    
    // Trivia
    'trivia.question': 'Question',
    'trivia.timeRemaining': 'Time Remaining',
    'trivia.answered': 'Answered',
    'trivia.reveal': 'Reveal Answers',
    
    // Missions
    'missions.yourMissions': 'Your Missions',
    'missions.complete': 'Mark Complete',
    'missions.completed': 'Completed',
    'missions.timeRemaining': 'Time Remaining',
    
    // Results
    'results.finalResults': 'Final Results',
    'results.winner': 'Winner',
    'results.podium': 'Podium',
    'results.share': 'Share Results',
    'results.finished': 'Finished',
  },
  cs: {
    // Landing
    'landing.title': 'Vánoční Herní Večer',
    'landing.subtitle': 'Rodinná Hra',
    'landing.selectLanguage': 'Vyberte Jazyk',
    'landing.createRoom': 'Vytvořit Místnost',
    'landing.joinRoom': 'Připojit se',
    
    // Room Creation
    'create.title': 'Vytvořit Herní Místnost',
    'create.subtitle': 'Vytvoř závodní místnost a pusť TV zobrazení na velké obrazovce.',
    'create.roomName': 'Název Místnosti',
    'create.roomNamePlaceholder': 'Vánoce 2024',
    'create.maxPlayers': 'Max Hráčů',
    'create.pinEnabled': 'Povolit PIN',
    'create.pinPlaceholder': '4 číslice',
    'create.selectGames': 'Vyberte Hry (3-5)',
    'create.dragToReorder': 'Přetáhněte pro změnu pořadí',
    'create.roomNameRequired': 'Název místnosti je povinný',
    'create.pinInvalid': 'PIN musí mít 4 číslice',
    'create.badge': 'Uspořádej vánoční závod',
    'create.badgeSub': 'TV + telefony',
    'create.raceSettings': 'Nastavení závodu',
    'create.difficulty': 'Obtížnost',
    'create.difficultyHelp': 'Ovlivní přísnost některých otázek/hádanek (do budoucna).',
    'create.allowSkips': 'Povolit přeskočení',
    'create.eventsEnabled': 'Event feed na TV',
    'create.eventsHelp': 'Ukazuje připojení a dokončení etap na TV.',
    'create.createRoom': 'Vytvořit Místnost',
    
    // Join
    'join.title': 'Připojit se',
    'join.enterCode': 'Zadejte Kód Místnosti',
    'join.codePlaceholder': 'ABCD',
    'join.enterPin': 'Zadejte PIN (pokud je vyžadován)',
    'join.pinPlaceholder': '1234',
    'join.join': 'Připojit',
    'join.invalidCode': 'Neplatný kód místnosti',
    'join.wrongPin': 'Špatný PIN',
    'join.roomFull': 'Místnost je plná',
    
    // Player
    'player.enterName': 'Zadejte Vaše Jméno',
    'player.namePlaceholder': 'Vaše jméno',
    'player.selectAvatar': 'Vyberte Avatara',
    'player.join': 'Připojit se',
    'player.nameRequired': 'Jméno je povinné',
    'player.nameTaken': 'Jméno je již obsazeno',
    'player.joined': 'Připojeno!',
    'player.setup': 'Nastavení hráče',
    'player.setupSubtitle': 'Vyber jméno a avatara — a můžeš závodit.',
    'player.openTv': 'Otevřít TV zobrazení',
    
    // Games
    'game.amazingRace': 'Úžasný Závod',
    'game.festiveDash': 'Vánoční Sprint',
    'game.triviaBlitz': 'Trivia Blitz',
    'game.emojiMovie': 'Hádej Film z Emoji',
    'game.secretMissions': 'Tajné Mise',
    'game.wouldYouRather': 'Co bys Raději',
    
    // Common
    'common.start': 'Start',
    'common.next': 'Další',
    'common.previous': 'Předchozí',
    'common.submit': 'Odeslat',
    'common.back': 'Zpět',
    'common.score': 'Skóre',
    'common.leaderboard': 'Žebříček',
    'common.waiting': 'Čekání...',
    'common.loading': 'Načítání...',
    'common.error': 'Chyba',
    'common.close': 'Zavřít',
    'common.copy': 'Kopírovat',
    'common.copied': 'Zkopírováno!',
    
    // Controller
    'controller.title': 'Ovládací Panel',
    'controller.startGame': 'Spustit Hru',
    'controller.nextRound': 'Další Kolo',
    'controller.previousRound': 'Předchozí Kolo',
    'controller.endGame': 'Ukončit Hru',
    'controller.passController': 'Předat Ovládání',
    'controller.startRace': 'Spustit závod',
    'controller.endRace': 'Ukončit závod',
    'controller.resetRoom': 'Reset místnosti',
    
    // TV
    'tv.roomCode': 'Kód Místnosti',
    'tv.scanToJoin': 'Naskenujte pro připojení',
    'tv.players': 'Hráči',
    'tv.waitingForController': 'Čekání na ovladač...',
    'tv.gameStarting': 'Hra se spouští...',
    'tv.raceStatus': 'Stav závodu',
    'tv.status': 'Stav',
    'tv.progressSummary': 'Dokončeno',
    'tv.lead': 'Vede',
    'tv.finished': 'V cíli!',
    'tv.eventFeed': 'Živý přehled',
    'tv.noEvents': 'Zatím žádné události.',
    'tv.eventJoined': 'se připojil/a',
    'tv.eventCompleted': 'dokončil/a',
    'tv.raceMap': 'Mapa závodu',
    'tv.track': 'Trať',
    
    // Amazing Race
    'race.stage': 'Etapa',
    'race.currentStage': 'Aktuální Etapa',
    'race.complete': 'Dokončeno',
    'race.hint': 'Nápověda',
    'race.correct': 'Správně!',
    'race.incorrect': 'Špatně',
    'race.progress': 'Pokrok',
    'race.rules': 'Pravidla',
    'race.typeAnswer': 'Napiš odpověď…',
    'race.showHint': 'Zobrazit nápovědu',
    'race.hideHint': 'Skrýt nápovědu',
    'race.locked': 'Pauza',
    'race.question': 'Otázka',
    'race.emojiProgress': 'Správně',
    'race.photoOptional': 'Volitelné nahrání fotky (+5 bonus)',
    'race.photoBonusNote': 'AI ověří tvou fotku. Pokud odpovídá úkolu, dostaneš bonus!',
    'race.validatePhoto': 'Ověřit fotku (+5)',
    'race.validatingPhoto': 'AI kontroluje tvou fotku...',
    'race.photoValidated': 'Fotka ověřena!',
    'race.photoInvalid': 'Fotka neodpovídá úkolu',
    'race.markDone': 'Hotovo',
    'race.markDoneNoPhoto': 'Hotovo (bez fotky)',
    'race.photoSelected': 'Vybraná fotka',
    'race.completed': 'Dokončeno!',
    'race.startMyRace': 'Začít můj závod',
    'race.lobbyPrompt': 'Až budeš připravený/á, začni svůj závod. Každý postupuje sám.',
    'race.openTv': 'TV zobrazení',
    'race.tv': 'TV',
    'race.finishedTitle': 'Jsi v cíli!',
    'race.finishedSubtitle': 'Skvělá práce — mrkni na TV na živé podium.',
    'race.backToTv': 'Zpět na TV',
    'race.viewResults': 'Zobrazit výsledky',
    
    // Trivia
    'trivia.question': 'Otázka',
    'trivia.timeRemaining': 'Zbývající Čas',
    'trivia.answered': 'Odpovězeno',
    'trivia.reveal': 'Zobrazit Odpovědi',
    
    // Missions
    'missions.yourMissions': 'Vaše Mise',
    'missions.complete': 'Označit jako Dokončené',
    'missions.completed': 'Dokončeno',
    'missions.timeRemaining': 'Zbývající Čas',
    
    // Results
    'results.finalResults': 'Finální Výsledky',
    'results.winner': 'Vítěz',
    'results.podium': 'Pódium',
    'results.share': 'Sdílet Výsledky',
    'results.finished': 'V cíli',
  },
};

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('language') as Language;
  return stored && (stored === 'en' || stored === 'cs') ? stored : 'en';
}

export function hasStoredLanguage(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('language');
  return stored === 'en' || stored === 'cs';
}

export function setLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
}

export function t(key: string, lang?: Language): string {
  const currentLang = lang || getLanguage();
  return translations[currentLang]?.[key] || key;
}

