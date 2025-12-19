#!/usr/bin/env node

/**
 * Enhanced script to map all remaining audio files
 * This will find matches for the 5 missing files
 */

import { readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');

const files = readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

// Manual mappings for the 5 missing files based on what we see
const MANUAL_MAPPINGS = {
  'mistletoe_01.mp3': files.find(f => f.toLowerCase().includes('mistletoe')),
  'nutcracker_01.mp3': files.find(f => f.toLowerCase().includes('nutcracker') || f.toLowerCase().includes('sugar plum')),
  'somewhere_01.mp3': files.find(f => f.toLowerCase().includes('somewhere') || f.toLowerCase().includes('memory')),
  'christmas_wrapping_01.mp3': files.find(f => f.toLowerCase().includes('wrapping')),
  'do_they_know_01.mp3': files.find(f => f.toLowerCase().includes('do they know') || f.toLowerCase().includes('band aid')),
};

console.log('🔍 Finding matches for missing files...\n');

let found = 0;
let notFound = [];

for (const [target, source] of Object.entries(MANUAL_MAPPINGS)) {
  if (!source) {
    console.log(`❌ ${target} - No match found`);
    notFound.push(target);
    continue;
  }
  
  const sourcePath = join(audioDir, source);
  const targetPath = join(audioDir, target);
  
  if (existsSync(targetPath)) {
    console.log(`✅ ${target} - Already exists`);
    found++;
    continue;
  }
  
  try {
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ ${target} ← ${source}`);
    found++;
  } catch (error) {
    console.log(`❌ ${target} - Failed: ${error.message}`);
    notFound.push(target);
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Mapped: ${found}/5`);
console.log(`   ❌ Not found: ${notFound.length}/5`);

if (notFound.length > 0) {
  console.log(`\n⚠️  Still missing:`);
  notFound.forEach(f => console.log(`   - ${f}`));
  console.log(`\n💡 These files may not be in your collection. The game will work`);
  console.log(`   without them - those specific questions just won't have audio.`);
} else {
  console.log(`\n🎉 All files mapped!`);
}
