# Audio Setup Guide

This application includes subtle Christmas sound effects and background music to enhance the gaming experience.

## Required Audio Files

To enable audio features, you need to add the following audio files to the `public/audio/` directory:

### Background Music
- **`christmas-ambient.mp3`** - Subtle background Christmas music (looped)
  - Should be a calm, ambient Christmas track
  - Volume is automatically set to 12% for subtlety
  - Recommended: Instrumental Christmas music, soft bells, or gentle holiday melodies

### Sound Effects
Add the following sound effects (all should be short, subtle, and festive):

- **`click.mp3`** - Button clicks and general interactions
- **`success.mp3`** - Successful actions (correct answers, room creation, etc.)
- **`ding.mp3`** - Error/incorrect feedback
- **`jingle.mp3`** - Optional: Special Christmas jingle
- **`page-turn.mp3`** - Page transitions and navigation
- **`whoosh.mp3`** - Smooth transitions and hover effects
- **`bell.mp3`** - Optional: Bell sound for special events
- **`cheer.mp3`** - Optional: Celebration sounds

## Where Sound Effects Are Used

### Navigation
- Navigation buttons (back, home, language switcher)
- Page transitions
- Link clicks

### Game Interactions
- Joining rooms
- Submitting answers (riddles, emoji guesses, trivia, code locks)
- Correct/incorrect answer feedback
- Room creation

### Volume Settings

The audio system uses subtle volumes by default:
- **Background Music**: 12% volume
- **Sound Effects**: 25% volume (can be adjusted per sound)

## Audio Files Format

All audio files should be in MP3 format and optimized for web:
- Keep file sizes reasonable (< 500KB for sound effects, < 2MB for background music)
- Use appropriate sample rates (44.1kHz is standard)
- Consider using compressed formats for smaller file sizes

## Free Audio Resources

You can find free Christmas sound effects and music at:
- [Freesound.org](https://freesound.org) - Search for "christmas" sounds
- [Zapsplat](https://www.zapsplat.com) - Free sound effects library
- [Free Music Archive](https://freemusicarchive.org) - Royalty-free music
- [Incompetech](https://incompetech.com/music/royalty-free/) - Free music by Kevin MacLeod

Make sure to check licenses and provide attribution if required.

## Testing Audio

Once you've added the audio files:
1. Clear your browser cache
2. Interact with buttons and navigation
3. Play a game to hear sound effects in action
4. The background music should start playing after your first interaction (browsers require user interaction to play audio)

## Disabling Audio

The audio system respects browser autoplay policies. If audio doesn't play:
- Make sure you've interacted with the page at least once
- Check that your browser allows autoplay for the site
- Verify that audio files exist in the correct directory
