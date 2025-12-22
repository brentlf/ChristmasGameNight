# AI Intro Videos (Per Mini‑Game)

This project supports **optional** intro videos per mini‑game.

If a video exists at:

- `public/intro/trivia.mp4`
- `public/intro/emoji.mp4`
- `public/intro/wyr.mp4`
- `public/intro/pictionary.mp4`
- `public/intro/guess_the_song.mp4`
- `public/intro/family_feud.mp4`
- `public/intro/bingo.mp4`

…then the UI (`GameIntro`) will auto‑play it. If not, it falls back to a lightweight animated card.

## Generate the videos (recommended)

### 1) Set your OpenAI key

Create `.env.local` **or** `.env` (or set it in your shell):

```env
OPENAI_API_KEY=sk-...
```

### 2) Install ffmpeg

You must have `ffmpeg` available on your PATH.

- Windows:
  - Install via `winget` (recommended) or download from an official build provider.
  - Verify in a new terminal: `ffmpeg -version`
- macOS: `brew install ffmpeg`
- Linux: `sudo apt-get install ffmpeg` (or your distro equivalent)

### 3) Run the generator

```bash
npm run generate:intros
```

This will create MP4s in `public/intro/` and the app will start using them immediately.

## Optional settings

You can control generation via environment variables:

- `INTRO_DURATION_SECONDS` (default `6`)
- `OPENAI_IMAGE_MODEL` (default `gpt-image-1`, fallback `dall-e-3`)
- `OPENAI_IMAGE_SIZE` (default `1792x1024`)

Example:

```bash
INTRO_DURATION_SECONDS=5 OPENAI_IMAGE_MODEL=gpt-image-1 npm run generate:intros
```

## Notes / gotchas

- The videos are **silent** on purpose (the app handles audio separately).
- If ffmpeg text rendering fails on your machine (font issue), the script automatically retries **without** text overlay.
- By default, `public/intro/` is ignored by git (`.gitignore`) so you can generate locally without committing large binaries. If you want the videos included in deployments, either:
  - commit the files (remove the ignore), or
  - generate them in your build/deploy step.


