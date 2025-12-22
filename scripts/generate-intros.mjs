/**
 * Generate per-mini-game intro videos at:
 *   public/intro/{trivia|emoji|wyr|pictionary|guess_the_song|family_feud|bingo}.mp4
 *
 * Pipeline:
 * 1) Use OpenAI Images API to generate a 16:9 background image per game.
 * 2) Use ffmpeg to animate (subtle zoom) + add a simple text overlay.
 *
 * Requirements:
 * - OPENAI_API_KEY env var
 * - ffmpeg installed and on PATH
 *
 * Usage:
 *   node scripts/generate-intros.mjs
 *
 * Optional env:
 * - INTRO_DURATION_SECONDS (default 6)
 * - OPENAI_IMAGE_MODEL (default gpt-image-1; fallback dall-e-3)
 * - OPENAI_IMAGE_SIZE (default 1792x1024)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'intro');
const TMP_DIR = path.join(ROOT, 'tmp', 'intro-gen');

const GAMES = [
  { id: 'trivia', title: 'Trivia Blitz', emoji: '⚡', vibe: 'fast-paced quiz show energy, bright gold sparkles' },
  { id: 'emoji', title: 'Emoji Movie Guess', emoji: '🎬', vibe: 'playful colorful icons, emoji collage, neon accents' },
  { id: 'wyr', title: 'Would You Rather', emoji: '🎄', vibe: 'festive mischievous debate, cozy christmas lights, split choice motif' },
  { id: 'pictionary', title: 'Pictionary', emoji: '🎨', vibe: 'hand-drawn doodles, sketch lines, marker strokes, art table vibe' },
  { id: 'guess_the_song', title: 'Guess the Christmas Song', emoji: '🎵', vibe: 'musical notes floating, festive sound waves, holiday melodies, warm concert hall atmosphere' },
  { id: 'family_feud', title: 'Christmas Family Feud', emoji: '🎯', vibe: 'game show stage, survey board aesthetic, competitive energy, bright studio lights, festive red and green accents' },
  { id: 'bingo', title: 'Christmas Bingo', emoji: '🎄', vibe: 'bingo cards, numbered balls, festive grid pattern, cozy game night atmosphere, warm holiday lights' },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function assertEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. Add it to .env.local or your shell env.`);
  return v;
}

function parseEnvFile(text) {
  const out = {};
  const lines = text.split(/\r?\n/g);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // Strip surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    out[key] = val;
  }
  return out;
}

function loadEnvIntoProcessEnv(filepath) {
  try {
    if (!fs.existsSync(filepath)) return;
    const txt = fs.readFileSync(filepath, 'utf8');
    const parsed = parseEnvFile(txt);
    for (const [k, v] of Object.entries(parsed)) {
      // Do not overwrite already-set environment variables
      if (process.env[k] === undefined) process.env[k] = String(v);
    }
  } catch {
    // best-effort; if env file can't be read, we fall back to process.env only
  }
}

function loadEnvFiles() {
  // Mirror common Next.js env conventions: .env.local overrides .env
  loadEnvIntoProcessEnv(path.join(ROOT, '.env.local'));
  loadEnvIntoProcessEnv(path.join(ROOT, '.env'));
}

function runFfmpeg(args) {
  const res = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (res.error) {
    throw new Error(
      `Failed to run ffmpeg (${String(res.error?.message || res.error)}). Is ffmpeg installed and on PATH?`
    );
  }
  if (res.status !== 0) throw new Error(`ffmpeg exited with code ${res.status}`);
}

async function openaiImage({ prompt, size, model }) {
  const apiKey = assertEnv('OPENAI_API_KEY');

  const body = {
    model,
    prompt,
    size,
    // Prefer base64 response so we don't have to chase hosted URLs.
    response_format: 'b64_json',
  };

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const msg = txt ? `${res.status} ${res.statusText}: ${txt}` : `${res.status} ${res.statusText}`;
    throw new Error(`OpenAI images error: ${msg}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`OpenAI images: unexpected response shape (missing data[0].b64_json)`);
  return Buffer.from(b64, 'base64');
}

function buildPrompt({ title, emoji, vibe }) {
  // Keep it family-friendly, non-branded, and avoid copyrighted logos/characters.
  return [
    'Create a festive Christmas game-night intro background image in 16:9.',
    `Theme for the game: "${title}" ${emoji}.`,
    `Vibe: ${vibe}.`,
    'Style: modern TV game-show graphics, cinematic lighting, high contrast, clean composition, subtle bokeh and particles.',
    'No logos, no copyrighted characters, no readable brand names.',
    'Leave some negative space near the center for title text overlay.',
  ].join(' ');
}

function makeIntroVideo({ bgPngPath, title, emoji, outMp4Path, durationSec }) {
  // 1920x1080 output, subtle zoom-in (Ken Burns), text overlay.
  // Note: drawtext uses system font by name; if unavailable, ffmpeg will error.
  // We fall back to a no-text render if drawtext fails.
  const fps = 30;
  const frames = durationSec * fps;

  const commonFilters = [
    "scale=1920:1080:force_original_aspect_ratio=increase",
    "crop=1920:1080",
    // zoompan: slowly zoom from 1.0 to ~1.08 across the clip
    `zoompan=z='min(1.08,1+0.08*on/${frames})':d=${frames}:s=1920x1080:fps=${fps}`,
    'format=yuv420p',
  ];

  const titleText = `${emoji} ${title}`;
  const drawTextFilters = [
    ...commonFilters,
    // shadow box for readability
    "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.15:t=fill",
    // Main title
    `drawtext=font='Arial':text='${titleText.replace(/:/g, '\\:').replace(/'/g, "\\\\'")}':x=(w-text_w)/2:y=(h*0.38):fontsize=72:fontcolor=white:shadowx=3:shadowy=3:shadowcolor=black@0.85`,
    // Subtitle
    `drawtext=font='Arial':text='Christmas Game Night':x=(w-text_w)/2:y=(h*0.52):fontsize=32:fontcolor=white@0.9:shadowx=2:shadowy=2:shadowcolor=black@0.7`,
  ];

  const argsWithText = [
    '-y',
    '-loop',
    '1',
    '-t',
    String(durationSec),
    '-i',
    bgPngPath,
    '-vf',
    drawTextFilters.join(','),
    '-r',
    String(fps),
    '-an', // silent by design (the app handles audio separately)
    '-movflags',
    '+faststart',
    outMp4Path,
  ];

  try {
    runFfmpeg(argsWithText);
    return;
  } catch (e) {
    console.warn(`[intro-gen] drawtext failed; retrying without text overlay. Reason: ${String(e?.message || e)}`);
  }

  const argsNoText = [
    '-y',
    '-loop',
    '1',
    '-t',
    String(durationSec),
    '-i',
    bgPngPath,
    '-vf',
    commonFilters.join(','),
    '-r',
    String(fps),
    '-an',
    '-movflags',
    '+faststart',
    outMp4Path,
  ];

  runFfmpeg(argsNoText);
}

async function main() {
  loadEnvFiles();

  const durationSec = Number(process.env.INTRO_DURATION_SECONDS || 6);
  const size = process.env.OPENAI_IMAGE_SIZE || '1792x1024';
  const preferredModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const fallbackModel = preferredModel === 'dall-e-3' ? 'gpt-image-1' : 'dall-e-3';

  ensureDir(OUT_DIR);
  ensureDir(TMP_DIR);

  console.log(`[intro-gen] Output dir: ${OUT_DIR}`);
  console.log(`[intro-gen] Temp dir:   ${TMP_DIR}`);
  console.log(`[intro-gen] Duration:   ${durationSec}s`);
  console.log(`[intro-gen] Image size: ${size}`);
  console.log(`[intro-gen] Model:      ${preferredModel} (fallback ${fallbackModel})`);

  for (const g of GAMES) {
    const outMp4 = path.join(OUT_DIR, `${g.id}.mp4`);
    const bgPng = path.join(TMP_DIR, `${g.id}.png`);

    console.log(`\n[intro-gen] ${g.id}: generating background...`);

    const prompt = buildPrompt(g);
    let imgBuf;
    try {
      imgBuf = await openaiImage({ prompt, size, model: preferredModel });
    } catch (e) {
      console.warn(`[intro-gen] Image gen failed with model=${preferredModel}. Retrying with ${fallbackModel}...`);
      imgBuf = await openaiImage({ prompt, size, model: fallbackModel });
    }

    fs.writeFileSync(bgPng, imgBuf);

    console.log(`[intro-gen] ${g.id}: rendering MP4 with ffmpeg...`);
    makeIntroVideo({
      bgPngPath: bgPng,
      title: g.title,
      emoji: g.emoji,
      outMp4Path: outMp4,
      durationSec,
    });

    if (!fileExists(outMp4)) {
      throw new Error(`[intro-gen] Failed to create ${outMp4}`);
    }

    console.log(`[intro-gen] ${g.id}: wrote ${path.relative(ROOT, outMp4)}`);
  }

  console.log('\n[intro-gen] Done. Launch the app and the Game Intro panel should auto-play these videos.');
}

main().catch((err) => {
  console.error(`\n[intro-gen] ERROR: ${err?.message || String(err)}`);
  process.exit(1);
});


