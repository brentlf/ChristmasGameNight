#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const contentPath = join(process.cwd(), 'content', 'guess_the_song_christmas.ts');
const content = readFileSync(contentPath, 'utf-8');

// Extract all audioSrc references
const audioSrcRegex = /audioSrc:\s*['"]([^'"]+)['"]/g;
const allReferences = [];
let match;

while ((match = audioSrcRegex.exec(content)) !== null) {
  allReferences.push(match[1]);
}

// Get unique filenames
const uniqueFiles = new Set(allReferences.map(path => path.split('/').pop()));

console.log('📊 Audio File Analysis\n');
console.log(`Total questions in game: ${allReferences.length}`);
console.log(`Unique audio files needed: ${uniqueFiles.size}`);
console.log(`\n💡 This means some songs reuse the same audio file for different question variants.`);
console.log(`   For example, "All I Want for Christmas" might be used for:`);
console.log(`   - Song title question`);
console.log(`   - Artist question (Mariah Carey)`);
console.log(`   - Movie question (Love Actually)`);
console.log(`\n📁 You have 94 MP3 files total, but only ${uniqueFiles.size} are needed.`);
console.log(`   The extra files are either duplicates or unused.`);

