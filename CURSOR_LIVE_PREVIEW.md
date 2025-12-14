# Using Cursor Live Preview

## ✅ Setup Complete

I've configured Cursor's live preview for your Next.js app. Here's how to use it:

## Method 1: Cursor's Built-in Preview (Recommended)

1. **Make sure dev server is running**:
   - The server should be starting now
   - Wait for it to finish compiling (30-60 seconds first time)

2. **Open Live Preview in Cursor**:
   - Look for the "Live Preview" icon in the sidebar (or press `Ctrl+Shift+P` / `Cmd+Shift+P`)
   - Type "Live Preview: Show Preview"
   - Or click the preview icon in the top-right corner

3. **The preview will open**:
   - Cursor will automatically detect `http://localhost:3000`
   - You'll see your app in a preview pane

## Method 2: Manual Browser

1. **Wait for server to start** (check terminal for "Ready" message)
2. **Open browser**: http://localhost:3000
3. **Or use Cursor's "Open in Browser"** command

## Troubleshooting

### Server Not Starting?

Check the terminal output for errors. Common issues:

1. **Port 3000 already in use**:
   ```bash
   # Kill process on port 3000
   netstat -ano | findstr :3000
   # Then kill the PID shown
   ```

2. **Missing dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables not loaded**:
   - Make sure `.env` file exists
   - Restart dev server after creating `.env`

### Live Preview Not Working?

1. **Check Cursor Settings**:
   - File > Preferences > Settings
   - Search for "live preview"
   - Make sure it's enabled

2. **Manual URL**:
   - In Live Preview, manually enter: `http://localhost:3000`

3. **Use External Browser**:
   - Right-click in preview pane
   - Select "Open in External Browser"

## Quick Commands

- **Start Server**: `npm run dev`
- **Stop Server**: `Ctrl+C` in terminal
- **Open Preview**: `Ctrl+Shift+P` → "Live Preview: Show Preview"
- **Open Browser**: `Ctrl+Click` on http://localhost:3000 in terminal

## Current Status

✅ Cursor settings configured
✅ Dev server starting...
⏳ Wait for compilation to complete
✅ Then use Live Preview!

