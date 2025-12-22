#!/usr/bin/env node

/**
 * Script to download audio files for the Guess the Christmas Song game
 * 
 * USAGE:
 * 1. Edit the URL_MAP below with direct download URLs for each file
 * 2. Run: node scripts/download-audio-files.mjs
 * 
 * NOTE: You need to provide the URLs yourself from royalty-free sources
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// Map of filename to download URL
// Add your URLs here from royalty-free sources
const URL_MAP = {
  'jingle_bells_01.mp3': '', // Add URL here
  'silent_night_01.mp3': '',
  'deck_the_halls_01.mp3': '',
  'we_wish_you_01.mp3': '',
  'o_holy_night_01.mp3': '',
  'joy_to_the_world_01.mp3': '',
  'away_in_manger_01.mp3': '',
  'the_first_noel_01.mp3': '',
  'hark_herald_01.mp3': '',
  'white_christmas_01.mp3': '',
  'let_it_snow_01.mp3': '',
  'winter_wonderland_01.mp3': '',
  'rockin_around_01.mp3': '',
  'jingle_bell_rock_01.mp3': '',
  'santa_claus_coming_01.mp3': '',
  'rudolph_01.mp3': '',
  'frosty_01.mp3': '',
  'all_i_want_01.mp3': '',
  'last_christmas_01.mp3': '',
  'feliz_navidad_01.mp3': '',
  '12_days_01.mp3': '',
  'chestnuts_01.mp3': '',
  'have_yourself_01.mp3': '',
  'it_beginning_01.mp3': '',
  'silver_bells_01.mp3': '',
  'carol_bells_01.mp3': '',
  'god_rest_01.mp3': '',
  'good_king_01.mp3': '',
  'here_comes_01.mp3': '',
  'holly_jolly_01.mp3': '',
  'little_drummer_01.mp3': '',
  'mistletoe_01.mp3': '',
  'nutcracker_01.mp3': '',
  'sleigh_ride_01.mp3': '',
  'somewhere_01.mp3': '',
  'underneath_01.mp3': '',
  'wonderful_time_01.mp3': '',
  'blue_christmas_01.mp3': '',
  'christmas_wrapping_01.mp3': '',
  'do_they_know_01.mp3': '',
};

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');

// Ensure directory exists
if (!existsSync(audioDir)) {
  mkdirSync(audioDir, { recursive: true });
}

async function downloadFile(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(filepath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed to download ${filepath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('📥 Downloading Audio Files for Guess the Christmas Song\n');
  
  const filesToDownload = Object.entries(URL_MAP).filter(([_, url]) => url);
  
  if (filesToDownload.length === 0) {
    console.log('❌ No URLs configured. Please edit URL_MAP in this script with download URLs.');
    console.log('\n💡 Sources for royalty-free Christmas music:');
    console.log('   - Freesound.org');
    console.log('   - YouTube Audio Library');
    console.log('   - Pixabay Music');
    console.log('   - Incompetech.com');
    return;
  }
  
  console.log(`Found ${filesToDownload.length} URLs configured.\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const [filename, url] of filesToDownload) {
    const filepath = join(audioDir, filename);
    
    if (existsSync(filepath)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      skipped++;
      continue;
    }
    
    console.log(`⬇️  Downloading ${filename}...`);
    const result = await downloadFile(url, filepath);
    
    if (result) {
      console.log(`✅ Downloaded ${filename}`);
      success++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Downloaded: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
}

main().catch(console.error);




