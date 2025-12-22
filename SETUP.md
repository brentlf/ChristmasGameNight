# Quick Setup Guide

## Step 1: Install Dependencies ✅
```bash
npm install
```
**Status: COMPLETED** - Dependencies are installed.

## Step 2: Firebase Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "Christmas Game Night")
4. Follow the setup wizard

### 2.2 Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **test mode** for development (or use production mode with the provided rules)
4. Choose a location (closest to your users)

### 2.3 Enable Anonymous Authentication
1. Go to "Authentication" > "Sign-in method"
2. Click on "Anonymous"
3. Enable it and save

### 2.4 Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (`</>`)
4. Register app (name it "Christmas Game Night")
5. Copy the config values

### 2.5 Create Environment File
Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2.6 Set Firestore Security Rules
1. In Firebase Console, go to "Firestore Database" > "Rules"
2. Copy the contents of `firestore.rules` from this project
3. Paste and publish

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 4: Test the App

1. **Create a Room**:
   - Select language
   - Click "Create Room"
   - Fill in room details
   - Select 3-5 games
   - Create room

2. **Join from Another Device**:
   - Scan QR code or enter room code
   - Enter name and select avatar
   - Start playing!

## Troubleshooting

### "Firebase not initialized" error
- Check that `.env.local` exists and has all required variables
- Restart the dev server after creating `.env.local`

### "Permission denied" in Firestore
- Verify security rules are published
- Check that Anonymous Auth is enabled

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

## Next Steps

- Customize game content in `content/games.ts`
- Adjust styling in `app/globals.css` and `tailwind.config.ts`
- Deploy to Vercel (see README.md)

