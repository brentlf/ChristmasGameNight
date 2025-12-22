#!/usr/bin/env node

/**
 * Script to check which audio files are needed for the Guess the Christmas Song game
 * Run: node scripts/check-audio-files.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

const contentPath = join(process.cwd(), 'content', 'guess_the_song_christmas.ts');
const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');

// Extract audio file paths from the content file
const content = readFileSync(contentPath, 'utf-8');
const audioSrcRegex = /audioSrc:\s*['"]([^'"]+)['"]/g;
const audioFiles = new Set();
let match;

while ((match = audioSrcRegex.exec(content)) !== null) {
  const fullPath = match[1];
  // Extract just the filename
  const filename = fullPath.split('/').pop();
  audioFiles.add(filename);
}

console.log('📋 Required Audio Files for Guess the Christmas Song\n');
console.log(`Total unique files needed: ${audioFiles.size}\n`);

const sortedFiles = Array.from(audioFiles).sort();
const missing = [];
const found = [];

for (const file of sortedFiles) {
  const filePath = join(audioDir, file);
  if (existsSync(filePath)) {
    found.push(file);
    console.log(`✅ ${file}`);
  } else {
    missing.push(file);
    console.log(`❌ ${file} (MISSING)`);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Found: ${found.length}/${audioFiles.size}`);
console.log(`   Missing: ${missing.length}/${audioFiles.size}`);

if (missing.length > 0) {
  console.log(`\n📝 Missing files list:`);
  missing.forEach(file => console.log(`   - ${file}`));
  console.log(`\n💡 Tip: Place these files in: public/audio/christmas_songs/`);
}




