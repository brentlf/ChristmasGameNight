# Firebase Configuration Check

## ✅ Environment Variables Required

Your `.env` file should contain these variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***
NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=***
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
NEXT_PUBLIC_FIREBASE_APP_ID=***
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=*** (optional - for analytics)
```

## ✅ Firebase Console Checklist

### 1. Firestore Database
- [ ] Database created
- [ ] Started in test mode OR production mode with security rules
- [ ] Location selected

### 2. Authentication
- [ ] Anonymous authentication enabled
- [ ] No other sign-in methods required (unless you want them)

### 3. Security Rules
- [ ] Copy `firestore.rules` content
- [ ] Paste in Firebase Console > Firestore > Rules
- [ ] Click "Publish"

## 🧪 Testing Connection

1. **Restart Dev Server** (if it's running):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Open Browser**: http://localhost:3000

3. **Test Flow**:
   - Select language
   - Click "Create Room"
   - If you see the room creation form, Firebase is connected! ✅
   - If you see errors, check browser console

## 🔍 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that all environment variables are set
- Restart dev server after creating `.env`
- Verify variable names match exactly (case-sensitive)

### "Permission denied" in Firestore
- Check that security rules are published
- Verify Anonymous Auth is enabled
- Check browser console for specific error

### Environment variables not loading
- Next.js reads `.env.local` with higher priority than `.env`
- If you have both, `.env.local` takes precedence
- Restart dev server after changing `.env` files

## ✅ Next Steps After Firebase Setup

1. ✅ Create a test room
2. ✅ Join from another device/browser tab
3. ✅ Test all 5 games
4. ✅ Verify real-time sync works

## 🎉 Ready to Play!

Once you can create a room without errors, you're all set!

