# Troubleshooting Guide

## Dev Server Not Starting?

### Check 1: Environment Variables
Make sure your `.env` file exists and has all variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Check 2: Dependencies
```bash
npm install
```

### Check 3: Port Conflict
If port 3000 is busy:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Check 4: Manual Server Start
Try starting the server manually to see errors:
1. Open a new terminal in Cursor
2. Run: `npm run dev`
3. Watch for error messages

## Using Cursor Live Preview

### Step 1: Wait for Server
- First compilation takes 30-60 seconds
- Look for "Ready" message in terminal
- Should see: `- Local: http://localhost:3000`

### Step 2: Open Live Preview
**Option A - Command Palette:**
1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: `Live Preview: Show Preview`
3. Press Enter

**Option B - Sidebar:**
1. Look for "Live Preview" icon in left sidebar
2. Click it
3. Click "Show Preview"

**Option C - Right-click:**
1. Right-click on `app/page.tsx`
2. Select "Show Preview"

### Step 3: Configure Preview
If preview doesn't show your app:
1. In preview pane, click the settings icon
2. Enter URL: `http://localhost:3000`
3. Or click "Open in External Browser"

## Alternative: Use Browser Directly

If Live Preview doesn't work:
1. Wait for server to show "Ready"
2. Open browser manually
3. Go to: http://localhost:3000

## Common Errors

### "Module not found"
```bash
npm install
```

### "Firebase not initialized"
- Check `.env` file exists
- Restart dev server after creating `.env`

### "Port 3000 already in use"
- Kill the process using port 3000
- Or change port: `npm run dev -- -p 3001`

### "Cannot find module"
- Delete `node_modules` and `.next`
- Run `npm install` again

## Quick Fix Commands

```bash
# Clean install
rm -rf node_modules .next
npm install
npm run dev

# Or on Windows PowerShell
Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
npm install
npm run dev
```

