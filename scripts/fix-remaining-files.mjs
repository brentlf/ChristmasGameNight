#!/usr/bin/env node

import { readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');

const files = readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

// Find files that might match
const rockinFiles = files.filter(f => f.toLowerCase().includes('rockin'));
const somewhereFiles = files.filter(f => f.toLowerCase().includes('somewhere') || f.toLowerCase().includes('memory'));

console.log('🔍 Searching for missing files...\n');

if (rockinFiles.length > 0) {
  console.log('Found Rockin\' Around files:');
  rockinFiles.forEach(f => console.log(`  - ${f}`));
  const source = rockinFiles[0];
  const target = join(audioDir, 'rockin_around_01.mp3');
  if (!existsSync(target)) {
    try {
      copyFileSync(join(audioDir, source), target);
      console.log(`✅ Created rockin_around_01.mp3 from ${source}\n`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}\n`);
    }
  }
}

if (somewhereFiles.length > 0) {
  console.log('Found Somewhere files:');
  somewhereFiles.forEach(f => console.log(`  - ${f}`));
  const source = somewhereFiles[0];
  const target = join(audioDir, 'somewhere_01.mp3');
  if (!existsSync(target)) {
    try {
      copyFileSync(join(audioDir, source), target);
      console.log(`✅ Created somewhere_01.mp3 from ${source}\n`);
    } catch (e) {
      console.log(`❌ Failed: ${e.message}\n`);
    }
  }
}

console.log('\n📝 Still need to add manually:');
console.log('   - mistletoe_01.mp3');
console.log('   - nutcracker_01.mp3');
console.log('   - christmas_wrapping_01.mp3');
console.log('   - do_they_know_01.mp3');
console.log('\n💡 These songs may not be in your collection. The game will work');
console.log('   without them - those specific questions just won\'t have audio.');




