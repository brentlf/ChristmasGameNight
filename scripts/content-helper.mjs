#!/usr/bin/env node

/**
 * Content Helper Script
 * Helper utilities for managing game content
 * 
 * Usage:
 *   node scripts/content-helper.mjs next-id <game-type>
 *   node scripts/content-helper.mjs count <game-type>
 *   node scripts/content-helper.mjs list-ids <game-type>
 * 
 * Game types: trivia, family-feud, song, pictionary, wyr, emoji
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const gameTypes = {
  trivia: { file: 'trivia_christmas.ts', prefix: 'trivia', array: 'triviaChristmasPool' },
  'family-feud': { file: 'family_feud_christmas.ts', prefix: 'ff', array: 'familyFeudChristmasPool' },
  song: { file: 'guess_the_song_christmas.ts', prefix: 'song', array: 'guessTheSongChristmasPool' },
  pictionary: { file: 'pictionary_christmas.ts', prefix: 'pic', array: 'pictionaryChristmasPool' },
  wyr: { file: 'would_you_rather_christmas.ts', prefix: 'wyr', array: 'wouldYouRatherChristmasPool' },
  emoji: { file: 'emoji_movies_christmas.ts', prefix: 'emoji', array: 'emojiMoviesChristmasPool' },
};

function getContentFile(gameType) {
  const config = gameTypes[gameType];
  if (!config) {
    console.error(`❌ Unknown game type: ${gameType}`);
    console.error(`   Valid types: ${Object.keys(gameTypes).join(', ')}`);
    process.exit(1);
  }
  
  const filePath = join(process.cwd(), 'content', config.file);
  try {
    return {
      content: readFileSync(filePath, 'utf-8'),
      config,
      filePath,
    };
  } catch (err) {
    console.error(`❌ Error reading ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

function extractIds(content, prefix) {
  const ids = [];
  const idRegex = new RegExp(`id:\\s*['"](${prefix}_\\d+)['"]`, 'g');
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function getNextId(gameType) {
  const { content, config } = getContentFile(gameType);
  const ids = extractIds(content, config.prefix);
  
  if (ids.length === 0) {
    console.log(`${config.prefix}_1`);
    return;
  }
  
  // Extract numbers and find max
  const numbers = ids.map(id => {
    const match = id.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  
  const maxNum = Math.max(...numbers);
  const nextId = `${config.prefix}_${maxNum + 1}`;
  
  console.log(`\n📝 Next ID for ${gameType}: ${nextId}\n`);
  console.log(`   File: content/${config.file}`);
  console.log(`   Current highest: ${config.prefix}_${maxNum}`);
  console.log(`   Next ID: ${nextId}\n`);
}

function countItems(gameType) {
  const { content, config } = getContentFile(gameType);
  const ids = extractIds(content, config.prefix);
  
  console.log(`\n📊 ${gameType.toUpperCase()} Content Count\n`);
  console.log(`   File: content/${config.file}`);
  console.log(`   Total items: ${ids.length}\n`);
}

function listIds(gameType) {
  const { content, config } = getContentFile(gameType);
  const ids = extractIds(content, config.prefix);
  
  // Sort IDs by number
  ids.sort((a, b) => {
    const numA = parseInt(a.match(/_(\d+)$/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/_(\d+)$/)?.[1] || '0', 10);
    return numA - numB;
  });
  
  console.log(`\n📋 ${gameType.toUpperCase()} IDs (${ids.length} total)\n`);
  
  // Print in columns if many items
  if (ids.length > 20) {
    const cols = 4;
    const rows = Math.ceil(ids.length / cols);
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const idx = i + j * rows;
        if (idx < ids.length) {
          row.push(ids[idx].padEnd(15));
        }
      }
      console.log('   ' + row.join(' '));
    }
  } else {
    ids.forEach(id => console.log(`   ${id}`));
  }
  console.log('');
}

function showHelp() {
  console.log(`
Content Helper Script

Usage:
  node scripts/content-helper.mjs <command> <game-type>

Commands:
  next-id    Show the next available ID for a game type
  count      Count items in a game type
  list-ids   List all IDs for a game type
  help       Show this help message

Game Types:
  trivia        Trivia questions
  family-feud   Family Feud questions
  song          Guess the Song items
  pictionary    Pictionary prompts
  wyr           Would You Rather items
  emoji         Emoji Movies items

Examples:
  node scripts/content-helper.mjs next-id trivia
  node scripts/content-helper.mjs count song
  node scripts/content-helper.mjs list-ids pictionary
`);
}

// Main
const command = process.argv[2];
const gameType = process.argv[3];

if (!command || command === 'help') {
  showHelp();
  process.exit(0);
}

if (!gameType) {
  console.error('❌ Game type required');
  showHelp();
  process.exit(1);
}

switch (command) {
  case 'next-id':
    getNextId(gameType);
    break;
  case 'count':
    countItems(gameType);
    break;
  case 'list-ids':
    listIds(gameType);
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

