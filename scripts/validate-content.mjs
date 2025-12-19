#!/usr/bin/env node

/**
 * Content Validation Script
 * Validates all game content files for correctness
 * 
 * Run: node scripts/validate-content.mjs
 * Or: npm run validate-content (if added to package.json)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

const errors = [];
const warnings = [];

// Helper to extract TypeScript arrays from files
function extractArrayFromTS(filePath, arrayName) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    // Simple regex to find the array - this is basic but works for our structure
    const arrayRegex = new RegExp(`export const ${arrayName}:\\s*\\[([\\s\\S]*?)\\];`, 'm');
    const match = content.match(arrayRegex);
    if (!match) {
      errors.push(`❌ Could not find array ${arrayName} in ${filePath}`);
      return null;
    }
    return content;
  } catch (err) {
    errors.push(`❌ Error reading ${filePath}: ${err.message}`);
    return null;
  }
}

// Extract IDs from content
function extractIds(content, idPrefix) {
  const ids = [];
  const idRegex = new RegExp(`id:\\s*['"](${idPrefix}_\\d+)['"]`, 'g');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

// Check for duplicate IDs
function checkDuplicateIds(content, idPrefix, fileName) {
  const ids = extractIds(content, idPrefix);
  const seen = new Set();
  const duplicates = [];
  
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  
  if (duplicates.length > 0) {
    errors.push(`❌ ${fileName}: Duplicate IDs found: ${duplicates.join(', ')}`);
  }
  
  return ids.length;
}

// Validate bilingual fields
function checkBilingualFields(content, fileName) {
  const missingEn = (content.match(/cs:\s*['"][^'"]+['"]/g) || []).filter(() => {
    // Check if preceding 'en' field exists
    return true; // Simplified check
  });
  
  // Check for patterns like: en: '' or cs: ''
  const emptyEn = content.match(/en:\s*['"]\s*['"]/g);
  const emptyCs = content.match(/cs:\s*['"]\s*['"]/g);
  
  if (emptyEn) {
    warnings.push(`⚠️  ${fileName}: Empty English translations found`);
  }
  if (emptyCs) {
    warnings.push(`⚠️  ${fileName}: Empty Czech translations found`);
  }
}

// Check audio file references
function checkAudioFiles(content, fileName) {
  const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');
  const audioSrcRegex = /audioSrc:\s*['"]([^'"]+)['"]/g;
  let match;
  const missingFiles = [];
  
  while ((match = audioSrcRegex.exec(content)) !== null) {
    const fullPath = match[1];
    const filename = fullPath.split('/').pop();
    const filePath = join(audioDir, filename);
    
    if (!existsSync(filePath)) {
      missingFiles.push(filename);
    }
  }
  
  if (missingFiles.length > 0) {
    errors.push(`❌ ${fileName}: Missing audio files: ${missingFiles.join(', ')}`);
  }
}

// Check trivia content
function validateTrivia() {
  console.log('📋 Validating Trivia...');
  const filePath = join(process.cwd(), 'content', 'trivia_christmas.ts');
  const content = extractArrayFromTS(filePath, 'triviaChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'trivia', 'trivia_christmas.ts');
  checkBilingualFields(content, 'trivia_christmas.ts');
  
  // Check for correctIndex patterns (should be 0-3)
  const invalidIndexes = [];
  const indexRegex = /correctIndex:\s*(\d+)/g;
  let match;
  while ((match = indexRegex.exec(content)) !== null) {
    const index = parseInt(match[1], 10);
    if (index < 0 || index > 3) {
      invalidIndexes.push(`Index ${index} (should be 0-3)`);
    }
  }
  
  if (invalidIndexes.length > 0) {
    errors.push(`❌ trivia_christmas.ts: Invalid correctIndex values: ${invalidIndexes.join(', ')}`);
  }
  
  console.log(`   ✓ Found ${count} trivia items`);
}

// Check Family Feud content
function validateFamilyFeud() {
  console.log('📋 Validating Family Feud...');
  const filePath = join(process.cwd(), 'content', 'family_feud_christmas.ts');
  const content = extractArrayFromTS(filePath, 'familyFeudChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'ff', 'family_feud_christmas.ts');
  checkBilingualFields(content, 'family_feud_christmas.ts');
  
  console.log(`   ✓ Found ${count} Family Feud questions`);
}

// Check Guess the Song content
function validateGuessTheSong() {
  console.log('📋 Validating Guess the Song...');
  const filePath = join(process.cwd(), 'content', 'guess_the_song_christmas.ts');
  const content = extractArrayFromTS(filePath, 'guessTheSongChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'song', 'guess_the_song_christmas.ts');
  checkBilingualFields(content, 'guess_the_song_christmas.ts');
  checkAudioFiles(content, 'guess_the_song_christmas.ts');
  
  // Check for correctIndex
  const invalidIndexes = [];
  const indexRegex = /correctIndex:\s*(\d+)/g;
  let match;
  while ((match = indexRegex.exec(content)) !== null) {
    const index = parseInt(match[1], 10);
    if (index < 0 || index > 3) {
      invalidIndexes.push(`Index ${index} (should be 0-3)`);
    }
  }
  
  if (invalidIndexes.length > 0) {
    errors.push(`❌ guess_the_song_christmas.ts: Invalid correctIndex values: ${invalidIndexes.join(', ')}`);
  }
  
  console.log(`   ✓ Found ${count} song items`);
}

// Check Pictionary content
function validatePictionary() {
  console.log('📋 Validating Pictionary...');
  const filePath = join(process.cwd(), 'content', 'pictionary_christmas.ts');
  const content = extractArrayFromTS(filePath, 'pictionaryChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'pic', 'pictionary_christmas.ts');
  checkBilingualFields(content, 'pictionary_christmas.ts');
  
  console.log(`   ✓ Found ${count} Pictionary prompts`);
}

// Check Would You Rather content
function validateWouldYouRather() {
  console.log('📋 Validating Would You Rather...');
  const filePath = join(process.cwd(), 'content', 'would_you_rather_christmas.ts');
  const content = extractArrayFromTS(filePath, 'wouldYouRatherChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'wyr', 'would_you_rather_christmas.ts');
  checkBilingualFields(content, 'would_you_rather_christmas.ts');
  
  console.log(`   ✓ Found ${count} Would You Rather items`);
}

// Check Emoji Movies content
function validateEmojiMovies() {
  console.log('📋 Validating Emoji Movies...');
  const filePath = join(process.cwd(), 'content', 'emoji_movies_christmas.ts');
  const content = extractArrayFromTS(filePath, 'emojiMoviesChristmasPool');
  if (!content) return;
  
  const count = checkDuplicateIds(content, 'emoji', 'emoji_movies_christmas.ts');
  checkBilingualFields(content, 'emoji_movies_christmas.ts');
  
  console.log(`   ✓ Found ${count} Emoji Movie items`);
}

// Main validation
console.log('🔍 Validating Game Content\n');
console.log('=' .repeat(50));

validateTrivia();
validateFamilyFeud();
validateGuessTheSong();
validatePictionary();
validateWouldYouRather();
validateEmojiMovies();

console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Summary\n');

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(err => console.log(`   ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(`   ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All content validated successfully!\n');
  process.exit(0);
} else if (errors.length > 0) {
  console.log(`\n❌ Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s)\n`);
  process.exit(1);
} else {
  console.log(`\n✅ Validation passed with ${warnings.length} warning(s)\n`);
  process.exit(0);
}

