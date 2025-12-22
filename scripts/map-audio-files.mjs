#!/usr/bin/env node

/**
 * Script to help map existing audio files to the required filenames
 * This will create a mapping file you can review and then rename files
 */

import { readdirSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');
const contentPath = join(process.cwd(), 'content', 'guess_the_song_christmas.ts');

// Get all existing MP3 files
const existingFiles = readdirSync(audioDir).filter(f => f.endsWith('.mp3') && !f.startsWith('.'));

// Extract required filenames from content
const content = readFileSync(contentPath, 'utf-8');
const audioSrcRegex = /audioSrc:\s*['"]([^'"]+)['"]/g;
const requiredFiles = new Set();
let match;

while ((match = audioSrcRegex.exec(content)) !== null) {
  const fullPath = match[1];
  const filename = fullPath.split('/').pop();
  requiredFiles.add(filename);
}

console.log('📋 Audio File Mapping Tool\n');
console.log(`Found ${existingFiles.length} existing MP3 files`);
console.log(`Need ${requiredFiles.size} unique files\n`);

// Create a simple mapping based on filename similarity
const mapping = {};
const usedFiles = new Set();

// Helper to find best match
function findBestMatch(required, available) {
  const requiredLower = required.toLowerCase().replace(/[_-]/g, '');
  
  for (const file of available) {
    if (usedFiles.has(file)) continue;
    
    const fileLower = file.toLowerCase().replace(/[_-]/g, '');
    
    // Check for exact matches or strong similarity
    if (fileLower.includes(requiredLower.split('_')[0]) || 
        requiredLower.includes(fileLower.split('-')[0])) {
      return file;
    }
  }
  
  // Try partial matches
  const requiredWords = requiredLower.split('_').filter(w => w.length > 3);
  for (const file of available) {
    if (usedFiles.has(file)) continue;
    const fileLower = file.toLowerCase();
    if (requiredWords.some(word => fileLower.includes(word))) {
      return file;
    }
  }
  
  return null;
}

// Create mappings
const sortedRequired = Array.from(requiredFiles).sort();
for (const required of sortedRequired) {
  const match = findBestMatch(required, existingFiles);
  if (match) {
    mapping[required] = match;
    usedFiles.add(match);
  }
}

// Display mapping
console.log('📝 Suggested Mappings:\n');
let mapped = 0;
for (const [required, existing] of Object.entries(mapping)) {
  console.log(`  ${required}`);
  console.log(`    ← ${existing}`);
  console.log('');
  mapped++;
}

console.log(`\n✅ Mapped: ${mapped}/${requiredFiles.size}`);
console.log(`❌ Unmapped: ${requiredFiles.size - mapped}\n`);

// Show unmapped required files
const mappedRequired = new Set(Object.keys(mapping));
const unmappedRequired = Array.from(requiredFiles).filter(r => !mappedRequired.has(r));
if (unmappedRequired.length > 0) {
  console.log('⚠️  Unmapped required files:');
  unmappedRequired.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Show unused existing files
const mappedExisting = new Set(Object.values(mapping));
const unusedExisting = existingFiles.filter(f => !mappedExisting.has(f));
if (unusedExisting.length > 0) {
  console.log('📦 Unused existing files:');
  unusedExisting.forEach(f => console.log(`   - ${f}`));
  console.log('');
}

// Ask if user wants to create rename script
console.log('💡 To apply these mappings, run:');
console.log('   node scripts/apply-audio-mapping.mjs\n');

// Save mapping to file
import { writeFileSync } from 'fs';
const mappingPath = join(process.cwd(), 'scripts', 'audio-mapping.json');
writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
console.log(`📄 Mapping saved to: ${mappingPath}`);



