#!/usr/bin/env node

import { readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');
const files = readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

// Map the new songs we added
const NEW_MAPPINGS = {
  'once_royal_david_01.mp3': files.find(f => f.toLowerCase().includes('royal') && f.toLowerCase().includes('david')),
};

console.log('🔍 Mapping new songs...\n');

for (const [target, source] of Object.entries(NEW_MAPPINGS)) {
  if (!source) {
    console.log(`❌ ${target} - No match found`);
    continue;
  }
  
  const sourcePath = join(audioDir, source);
  const targetPath = join(audioDir, target);
  
  if (existsSync(targetPath)) {
    console.log(`✅ ${target} - Already exists`);
    continue;
  }
  
  try {
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ ${target} ← ${source}`);
  } catch (error) {
    console.log(`❌ ${target} - Failed: ${error.message}`);
  }
}

