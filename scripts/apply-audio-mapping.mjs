#!/usr/bin/env node

/**
 * Script to rename audio files to match the required filenames
 * Edit the MAPPING object below to match your files
 */

import { renameSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const audioDir = join(process.cwd(), 'public', 'audio', 'christmas_songs');

// Manual mapping - edit this to match your files
const MAPPING = {
  'jingle_bells_01.mp3': 'jingle-bells-444574.mp3',
  'silent_night_01.mp3': 'silent-night-new-version-12358.mp3',
  'deck_the_halls_01.mp3': 'christmas-deck-the-halls-christmas-music-444585.mp3',
  'we_wish_you_01.mp3': 'we-wish-you-a-merry-christmas-444573.mp3',
  'o_holy_night_01.mp3': 'o-holy-night-gentle-christmas-piano-melodie-250841.mp3',
  'joy_to_the_world_01.mp3': 'joy-to-the-world-129908.mp3',
  'away_in_manger_01.mp3': 'away-in-a-manger-bells-background-xmas-music-for-video-37-second-423550.mp3',
  'the_first_noel_01.mp3': 'the-first-noel-a-holiday-piano-classic-calm-and-relaxing-250837.mp3',
  'hark_herald_01.mp3': 'hark-the-herald-angels-sing-traditional-english-christmas-carol-178364.mp3',
  'white_christmas_01.mp3': 'White Christmas【Christmas Song】_ Bing Crosby -Piano Cover- - Iso Piano.mp3',
  'let_it_snow_01.mp3': 'let-it-snow-christmas-new-year-holidays-background-intro-theme-267104.mp3',
  'winter_wonderland_01.mp3': 'Winter Wonderland - Instrumental - Matthew Anniss.mp3',
  'rockin_around_01.mp3': 'Brenda Lee - Rockin\' Around The Christmas Tree  Christmas Piano Cover by Pianella Piano - Jova Musique - Pianella Piano (1).mp3',
  'jingle_bell_rock_01.mp3': 'Christmas - Jingle Bell Rock  Christmas Piano Cover by Pianella Piano - Jova Musique - Pianella Piano.mp3',
  'santa_claus_coming_01.mp3': 'santa-claus-is-coming-to-town-happy-christmas-piano-250830.mp3',
  'rudolph_01.mp3': 'Rudolph the Red Nosed Reindeer Instrumental  Christmas Songs and Carols - Yoga Sounds.mp3',
  'frosty_01.mp3': 'Beegie Adair - Frosty the Snowman (Visualizer) - BeegieAdairVEVO.mp3',
  'all_i_want_01.mp3': 'Mariah Carey - All I Want For Christmas Is You (Piano Cover) - Rousseau.mp3',
  'last_christmas_01.mp3': 'Wham! - Last Christmas  Piano Cover with Strings (with Lyrics & PIANO SHEET) - John Rod Dondoyano.mp3',
  'feliz_navidad_01.mp3': 'Christmas Song - Feliz Navidad  Piano Cover by Pianella Piano - Jova Musique - Pianella Piano.mp3',
  '12_days_01.mp3': 'The Twelve Days of Christmas - Instrumental Christmas Music  Orchestra & Big Band - Pudding TV - Nursery Rhymes.mp3',
  'chestnuts_01.mp3': 'The Christmas Song (Chestnuts Roasting on an Open Fire) - Jazz Piano Cover - Alca Animusic on Piano.mp3',
  'have_yourself_01.mp3': 'Have Yourself a Merry Little Christmas - Jazz Piano Cover + Sheet Music - Piano Mario.mp3',
  'it_beginning_01.mp3': 'It\'s Beginning To Look A Lot Like Christmas - Michael Bublé  Piano Cover + Sheet Music - Francesco Parrino.mp3',
  'silver_bells_01.mp3': 'Silver Bells (Piano Cover) Sam Jennings, Piano - Sam Jennings.mp3',
  'carol_bells_01.mp3': 'christmas-carol-of-the-bells-music-269799.mp3',
  'god_rest_01.mp3': 'god-rest-ye-merry-gentlemen-orchestral-version-275366.mp3',
  'good_king_01.mp3': 'good-king-wenceslas-english-christmas-carol-piano-and-shimmer-pad-11556.mp3',
  'here_comes_01.mp3': 'Here Comes Santa Claus (Instrumental) - The London Fox Players.mp3',
  'holly_jolly_01.mp3': 'HOLLY JOLLY CHRISTMAS  Instrumental Version  (LYRIC VIDEO) 🎄❄😊 - Don Salmon Music.mp3',
  'little_drummer_01.mp3': 'THE LITTLE DRUMMER BOY 🥁 Instrumental With Lyrics  Christmas Carol 🎄 PIANO Cover - Don Salmon Music.mp3',
  'mistletoe_01.mp3': '', // Not found - you may need to add this
  'nutcracker_01.mp3': '', // Not found - you may need to add this
  'sleigh_ride_01.mp3': 'Sleigh Ride by Leroy Anderson . Played here by  the  Boston Pops Orchestra - Nigel Fowler Sutton.mp3',
  'somewhere_01.mp3': '', // Not found - you may need to add this
  'underneath_01.mp3': 'Kelly Clarkson - Underneath the Tree  Piano Cover by Pianella Piano - Jova Musique - Pianella Piano.mp3',
  'wonderful_time_01.mp3': 'Wonderful Christmas time _ Paul McCartney -Piano Cover- - Iso Piano.mp3',
  'blue_christmas_01.mp3': 'Blue Christmas - Beautiful Jazz piano cover (Tutorial + SHEET MUSIC) - Clavier.mp3',
  'christmas_wrapping_01.mp3': '', // Not found - you may need to add this
  'do_they_know_01.mp3': '', // Not found - you may need to add this
};

console.log('🔄 Renaming Audio Files\n');

let success = 0;
let skipped = 0;
let failed = 0;

for (const [targetName, sourceName] of Object.entries(MAPPING)) {
  if (!sourceName) {
    console.log(`⏭️  Skipping ${targetName} (no source file specified)`);
    skipped++;
    continue;
  }
  
  const sourcePath = join(audioDir, sourceName);
  const targetPath = join(audioDir, targetName);
  
  if (!existsSync(sourcePath)) {
    console.log(`❌ Source not found: ${sourceName}`);
    failed++;
    continue;
  }
  
  if (existsSync(targetPath)) {
    console.log(`⏭️  Skipping ${targetName} (already exists)`);
    skipped++;
    continue;
  }
  
  try {
    // Copy instead of rename to preserve originals
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ ${targetName} ← ${sourceName}`);
    success++;
  } catch (error) {
    console.log(`❌ Failed to copy ${sourceName}: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Copied: ${success}`);
console.log(`   ⏭️  Skipped: ${skipped}`);
console.log(`   ❌ Failed: ${failed}`);

if (skipped > 0) {
  console.log(`\n💡 Note: Files were copied (not renamed) to preserve originals.`);
  console.log(`   You can delete the original files if you want.`);
}
