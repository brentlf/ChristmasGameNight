# Content Management Quick Reference

A quick reference guide for common content management tasks.

## 📚 Documentation

- **[CONTENT_MANAGEMENT.md](./CONTENT_MANAGEMENT.md)** - Complete guide
- **[content/CONTENT_TEMPLATES.md](./content/CONTENT_TEMPLATES.md)** - Copy-paste templates
- **[content/CONTENT_STRUCTURE.md](./content/CONTENT_STRUCTURE.md)** - Technical details

## 🚀 Quick Commands

```bash
# Validate all content (run before committing!)
npm run validate-content

# Check if audio files exist
npm run check-audio

# Find unused audio files
npm run find-unused-audio

# Get next ID for adding new content
npm run content:next-id <game-type>

# Count items in a game type
npm run content:count <game-type>

# List all IDs for a game type
npm run content:list-ids <game-type>
```

## 📝 Common Tasks

### Add a New Trivia Question

1. Check next ID: `npm run content:next-id trivia`
2. Open `content/trivia_christmas.ts`
3. Copy template from `content/CONTENT_TEMPLATES.md`
4. Fill in question, options, and translations
5. Validate: `npm run validate-content`
6. Test in game

### Add a New Song

1. Place audio file in `public/audio/christmas_songs/`
2. Check next ID: `npm run content:next-id song`
3. Open `content/guess_the_song_christmas.ts`
4. Copy template from `content/CONTENT_TEMPLATES.md`
5. Add entry with correct `audioSrc` path
6. Validate: `npm run validate-content`
7. Check audio: `npm run check-audio`
8. Test in game

### Fix a Typo

1. Open the relevant content file
2. Search for the text (Ctrl+F)
3. Fix the typo in both languages if needed
4. Validate: `npm run validate-content`
5. Test in game

### Update a Translation

1. Open the relevant content file
2. Find the item (search by ID or text)
3. Update the `cs` (Czech) or `en` (English) field
4. Validate: `npm run validate-content`
5. Test in game (both languages)

## 📁 File Locations

| Content Type | File |
|-------------|------|
| Trivia | `content/trivia_christmas.ts` |
| Family Feud | `content/family_feud_christmas.ts` |
| Guess the Song | `content/guess_the_song_christmas.ts` |
| Pictionary | `content/pictionary_christmas.ts` |
| Would You Rather | `content/would_you_rather_christmas.ts` |
| Emoji Movies | `content/emoji_movies_christmas.ts` |
| Audio Files | `public/audio/christmas_songs/` |

## 🔍 ID Patterns

| Game Type | ID Format | Example |
|-----------|-----------|---------|
| Trivia | `trivia_N` | `trivia_1`, `trivia_50` |
| Family Feud | `ff_N` | `ff_1`, `ff_30` |
| Song | `song_N` | `song_1`, `song_62` |
| Pictionary | `pic_N` | `pic_1`, `pic_50` |
| Would You Rather | `wyr_N` | `wyr_1`, `wyr_40` |
| Emoji | `emoji_N` | `emoji_1`, `emoji_25` |

## ✅ Before Committing

- [ ] Ran `npm run validate-content` (no errors)
- [ ] Tested changes in game (both languages)
- [ ] Audio files exist (if added songs)
- [ ] IDs are sequential and unique
- [ ] Both English and Czech translations are complete

## 🐛 Troubleshooting

**Content not showing?**
- Check TypeScript compilation: `npm run build`
- Verify ID is unique (no duplicates)
- Check browser console for errors

**Audio not playing?**
- Verify file exists: `npm run check-audio`
- Check path in `audioSrc` matches file location
- Ensure file is MP3 format

**Validation errors?**
- Check error message for specific issue
- Verify all required fields are present
- Ensure translations are non-empty
- Check IDs are unique

## 💡 Tips

1. **Always validate before committing** - Catch errors early
2. **Test both languages** - Translations matter!
3. **Use sequential IDs** - Makes content easier to manage
4. **Keep it family-friendly** - Appropriate for all ages
5. **Proofread translations** - Get native speakers when possible

## 📞 Need Help?

- Check the full guide: [CONTENT_MANAGEMENT.md](./CONTENT_MANAGEMENT.md)
- Review examples in existing content files
- Run validation to see specific errors
- Check TypeScript errors in your IDE
