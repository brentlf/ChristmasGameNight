# Christmas Amazing Race 🎄🏁

A polished family “Amazing Race” web app built for **TV hub + phone players**. Everyone progresses **independently** (no synchronized rounds): one player can be on Stage 6 while another is still on Stage 2.

## Features

- **TV hub** (`/room/[roomId]/tv`): join QR + room code, player tiles, live leaderboard, race map, event feed
- **Phones** (`/room/[roomId]/play`): join with name + avatar, then complete stages independently
- **English + Czech**: language selection first + header toggle anytime
- **Race track engine**: per-player `stageIndex` + `stageState`, refresh-safe progress
- **6 checkpoints (solo)**:
  1. Riddle gate (text)
  2. Emoji movie/song guessing (3/5)
  3. Solo trivia (5 questions, 20s timer each)
  4. Code lock (4-digit)
  5. Photo scavenger (optional upload for bonus)
  6. Final riddle (finish screen + podium)
- **Firebase**: Firestore (real-time), Anonymous Auth
- **OpenAI Vision API**: Validates photos without storing them (no Storage needed!)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase** (Firestore + Anonymous Auth + Storage)
- **React Hot Toast** for notifications
- **QRCode.react** for join links

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database**
3. Enable **Anonymous Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Anonymous"
4. Copy your Firebase config values
5. Get an **OpenAI API Key** from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Used for photo validation in Stage 5 (no image storage needed!)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=sk-your_openai_key_here
```

### 4. Firebase Security Rules

**Firestore Rules:**
- Use the included `firestore.rules` file and paste it into Firebase Console → Firestore → Rules.

**Note:** Photos are validated via OpenAI Vision API and not stored. No Storage rules needed!

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

### Creating a Room

1. Select your language (English or Czech)
2. Click "Create Room"
3. Enter room name, set max players, optionally enable PIN
4. Click "Create Room"
5. Put the TV view on the big screen
6. Players scan the QR code to join

### Joining a Room

1. Select language
2. Click "Join Room"
3. Enter the 4-letter room code
4. Enter PIN if required
5. Enter your name and select an avatar
6. Start playing!

## Winner Logic

Leaderboard sorting:

1. Highest `stageIndex` (furthest)
2. If tied: earliest `finishedAt`
3. If tied: highest `score`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## Project Structure

```
├── app/
│   ├── create/          # Room creation page
│   ├── join/            # Join room page
│   ├── room/
│   │   └── [roomId]/
│   │       ├── tv/      # TV hub view
│   │       ├── play/    # Player view
│   │       └── results/ # Results page
│   ├── layout.tsx
│   ├── page.tsx         # Landing page
│   └── globals.css
├── content/
│   └── raceTracks/
│       └── christmas_race_v1.ts   # Race content (EN/CS)
├── lib/
│   ├── firebase.ts      # Firebase initialization
│   ├── raceEngine.ts    # Race engine (submit + scoring + lockouts)
│   ├── raceContent.ts   # Race content helpers (lookup by id)
│   ├── hooks/           # React hooks for Firestore
│   ├── i18n.ts          # Internationalization
│   └── utils/           # Utility functions
├── types/
│   └── index.ts         # TypeScript types
└── README.md
```

## Editing Race Content

All race content (EN + CS) lives in:

- `content/raceTracks/christmas_race_v1.ts`

## Troubleshooting

### Firebase Connection Issues
- Check that all environment variables are set correctly
- Verify Firestore is enabled in Firebase Console
- Check browser console for specific error messages

### Players Can't Join
- Verify room code is correct (case-insensitive)
- Check if room has reached max players
- Ensure PIN is entered correctly if enabled

### Real-time Updates Not Working
- Check Firestore security rules
- Verify anonymous authentication is enabled
- Check browser console for errors

## License

This project is open source and available for personal use.

