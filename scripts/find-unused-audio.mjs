#!/usr/bin/env node

import { readdirSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');
const contentPath = join(process.cwd(), 'content', 'guess_the_song_christmas.ts');

// Get all MP3 files
const allFiles = readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

// Get required files from content
const content = readFileSync(contentPath, 'utf-8');
const audioSrcRegex = /audioSrc:\s*['"]([^'"]+)['"]/g;
const requiredFiles = new Set();
let match;

while ((match = audioSrcRegex.exec(content)) !== null) {
  const filename = match[1].split('/').pop();
  requiredFiles.add(filename);
}

// Find unused files (files that don't match required names)
const unusedFiles = allFiles.filter(file => !requiredFiles.has(file));

console.log('📋 Unused Audio Files Analysis\n');
console.log(`Total files: ${allFiles.length}`);
console.log(`Required files: ${requiredFiles.size}`);
console.log(`Unused files: ${unusedFiles.length}\n`);

console.log('🎵 Unused files that could be added to the game:\n');
unusedFiles.forEach((file, idx) => {
  console.log(`${idx + 1}. ${file}`);
});

// Save to file for reference
import { writeFileSync } from 'fs';
const unusedListPath = join(process.cwd(), 'scripts', 'unused-audio-files.json');
writeFileSync(unusedListPath, JSON.stringify(unusedFiles, null, 2));
console.log(`\n📄 List saved to: ${unusedListPath}`);
