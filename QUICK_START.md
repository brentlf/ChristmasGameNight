# 🚀 Quick Start Guide

## ✅ Firebase is Configured!

Great! You've set up Firebase. Now let's get the app running.

## Step 1: Restart Dev Server

**Important**: Restart the dev server to load your new environment variables.

1. **Stop the current server** (if running):
   - Press `Ctrl+C` in the terminal

2. **Start it again**:
   ```bash
   npm run dev
   ```

## Step 2: Test the App

1. **Open your browser**: http://localhost:3000

2. **You should see**:
   - Language selector (English / Čeština)
   - "Create Room" and "Join Room" buttons

3. **Test room creation**:
   - Click "Create Room"
   - Fill in the form
   - Select games
   - Click "Create Room"
   - ✅ If it works, you'll see the TV view with a QR code!

## Step 3: Deploy Firestore Security Rules

**Important**: Do this before creating real rooms!

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to your project
3. Click **Firestore Database** > **Rules**
4. Copy the entire content from `firestore.rules` file
5. Paste it into the rules editor
6. Click **Publish**

## Step 4: Enable Anonymous Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Find **Anonymous**
3. Click to enable it
4. Save

## 🎮 You're Ready!

Once you can:
- ✅ See the landing page
- ✅ Create a room
- ✅ See the TV view with QR code

**You're all set!** The app is fully functional.

## 🧪 Test Flow

1. **Create Room** (on your computer)
   - Select language
   - Create room with 3-5 games
   - Note the room code

2. **Join Room** (on phone or another browser tab)
   - Go to http://localhost:3000/join
   - Enter room code
   - Enter name and select avatar
   - Join!

3. **Start Game** (as controller)
   - Click "Start Game" in control panel
   - Players can now play!

4. **Play Games**
   - TV shows the game state
   - Players answer on their phones
   - Scores update in real-time!

## 🐛 Troubleshooting

### Can't create room / Firebase errors
- Check browser console (F12) for errors
- Verify all environment variables are set
- Make sure Anonymous Auth is enabled
- Restart dev server

### "Permission denied"
- Deploy Firestore security rules (see Step 3 above)
- Check that Anonymous Auth is enabled

### Environment variables not working
- Make sure file is named `.env` (not `.env.txt`)
- Restart dev server after creating/editing `.env`
- Check that variable names start with `NEXT_PUBLIC_`

## 📱 Testing on Multiple Devices

1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` or `ip addr`

2. On your phone, go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

3. Make sure phone and computer are on the same WiFi network

## 🎉 Have Fun!

Your Christmas Game Night app is ready! Enjoy playing with your family! 🎄🎅🎁

