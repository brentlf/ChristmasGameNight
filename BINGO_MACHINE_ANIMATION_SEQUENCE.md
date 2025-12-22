# Bingo Ball Machine - Animation Sequence Documentation

## 🎯 Overview
This document describes the complete sequence of events and animations for the Bingo Ball Machine, from initial load to drawing a ball.

---

## 📋 **ON LOAD (Initial State)**

### Visual State:
1. **3D Scene Renders:**
   - Transparent light blue glass drum/globe (dome) at top
   - Light blue rectangular base at bottom
   - Central shaft connecting base to drum
   - Central hub with 4 spokes (cross pattern) positioned at bottom of drum
   - **16 colored bingo balls** initially positioned randomly within the dome sphere

2. **Ball Behavior (Not Spinning):**
   - All 16 inner balls **sink to the bottom** of the globe
   - Balls settle at bottom center (y: -0.2 relative to agitator group)
   - Balls spread slightly horizontally (max 0.3 radius spread) to avoid perfect stacking
   - Sinking speed: 0.8 (gravity-like effect)

3. **UI Overlays:**
   - "Ready" / "Připraveno" text displayed at top center (white, semi-transparent)
   - "🎄 BINGO 🎄" label at bottom
   - No ball number displayed yet

4. **3D Components:**
   - **Drum**: Stationary, transparent light blue sphere
   - **Base**: Stationary light blue box with dark blue display panel and red crank handle
   - **Agitator**: Stationary hub and spokes at bottom of drum
   - **Inner Balls**: Sinking/settled at bottom of globe

---

## 🎲 **ON "DRAW NEXT BALL" BUTTON CLICK**

### Step 1: Button Click (0ms)
- **User Action**: Host clicks "Draw Next Ball" button
- **Audio**: `click` sound plays (volume: 0.1)
- **State Changes**:
  - `isDrawing` → `true`
  - `busy` → `true`
  - Button shows "Drawing..." / "Losuje se..."

### Step 2: Ball Selection (Instant)
- **Backend**: `drawBingoBall()` function executes
  - Randomly selects a ball from available pool (1-75, excluding already drawn)
  - Updates Firestore: `currentSession.drawnBalls` array
- **State**: `currentBall` prop updates (e.g., "B-12")
- **Audio**: `jingle` sound plays (volume: 0.2)

### Step 3: Animation Sequence Begins (0ms)
When `currentBall` changes and differs from previous ball:

---

## ⏱️ **ANIMATION TIMELINE**

### **Phase 1: Fast Spin (0ms - 700ms)**

**At 0ms:**
- ✅ **Drum Animation:**
  - `spinning` → `true`
  - `spinPhase` → `'fast'`
  - Drum starts rotating on Y-axis at speed: **2.0** radians/second
- ✅ **Inner Balls Animation:**
  - Balls transition from "sinking" mode to "random movement" mode
  - Each ball gets random target positions within the dome sphere
  - Balls move randomly throughout the full volume of the globe
  - Movement speed: **0.032** (fast phase)
  - Velocity multiplier: **2.0**
  - Balls occasionally (1% chance per frame) pick new random targets
  - Balls constrained to stay within sphere (radius 1.2)
  - Random jitter added (10% chance per frame) for chaos
- ✅ **Audio**: `jingle` sound plays (volume: 0.15) - "bingo.spin" event

**During 0ms - 700ms:**
- Drum continues fast rotation
- Inner balls continue chaotic random movement within dome
- Balls stay within sphere bounds

---

### **Phase 2: Slow Spin Transition (700ms)**

**At 700ms:**
- ✅ **State Change:**
  - `spinPhase` → `'slow'`
- ✅ **Drum Animation:**
  - Drum rotation speed reduces to: **0.8** radians/second
- ✅ **Inner Balls Animation:**
  - Movement speed reduces to: **0.016** (slow phase)
  - Velocity multiplier reduces to: **0.8**
  - Balls continue random movement but slower

---

### **Phase 3: Ball Transit Start (500ms)**

**At 500ms (REVEAL_DELAY_MS - BALL_TRANSIT_MS = 1100 - 600 = 500ms):**
- ✅ **State Change:**
  - `ballInTransit` → `currentBall` (e.g., "B-12")
  - `transitProgress` → starts at 0
- ✅ **Transit Ball Appears:**
  - Green ball (`#22c55e`) spawns at tube position
  - Start position: `[0, 0.2, 0]` (below dome, above base)
  - Ball size: `0.15` radius
- ✅ **Transit Animation Begins:**
  - Ball moves from start position to landing tray
  - End position: `[0, -0.45, 0.65]` (in landing tray, below display panel, in front of base)
  - Animation duration: **600ms** (BALL_TRANSIT_MS)
  - Progress calculated: `(elapsed / 600)`
  - Ball scales up during transit: `0.3 + (progress * 0.5)` = 0.3 to 0.8

**During 500ms - 1100ms:**
- Green transit ball travels down and forward
- Ball grows in size as it approaches landing tray
- Drum continues slow rotation
- Inner balls continue slow random movement

**At ~800ms (80% of transit):**
- Landing bounce effect begins
- Ball bounces slightly when landing (sine wave, amplitude 0.02)

---

### **Phase 4: Ball Reveal & Spinning Stop (1100ms)**

**At 1100ms (REVEAL_DELAY_MS):**
- ✅ **Transit Animation Completes:**
  - `transitProgress` → `1.0`
- ✅ **State Changes:**
  - `displayBall` → `currentBall` (e.g., "B-12")
  - `ballInTransit` → `null`
  - `transitProgress` → `0`
  - `revealing` → `true`
- ✅ **Display Ball Appears:**
  - Blue ball (`#3b82f6`) appears in landing tray
  - Position: `[0, -0.45, 0.65]` (same as transit end)
  - Ball size: `0.18` radius
  - Ball performs gentle pulsing scale animation: `1 + sin(time * 0.01) * 0.05`
- ✅ **UI Overlay:**
  - Ball number text appears (e.g., "B" on top line, "12" on bottom line)
  - Positioned at bottom center, above landing tray
  - Text color: Dark blue (`text-blue-900`)
  - Font sizes: `text-4xl md:text-5xl` (letter) and `text-5xl md:text-6xl` (number)
- ✅ **Audio**: `ding` sound plays (volume: 0.2) - "bingo.ball_pop" event

**At 1100ms + 100ms (1200ms):**
- ✅ **Spinning Stops:**
  - `spinning` → `false`
  - `spinPhase` → `null`
  - `revealing` → `false` (stops pulsing animation)
- ✅ **Inner Balls:**
  - Transition back to "sinking" mode
  - Balls start sinking to bottom of globe
  - Sink speed: 0.8

---

## 🎬 **FINAL STATE (After Animation)**

### Visual State:
1. **Drum**: Stationary again
2. **Inner Balls**: Sinking/settling at bottom of globe
3. **Display Ball**: Blue ball in landing tray, pulsing slightly
4. **UI**: Ball number displayed prominently
5. **Button**: Returns to "Draw Next Ball" / "Vylosovat kouli" (enabled after isDrawing timeout)

---

## 🔄 **RESET SEQUENCE**

If `currentBall` becomes `null` (game reset):
- ✅ All states reset:
  - `displayBall` → `null`
  - `spinning` → `false`
  - `spinPhase` → `null`
  - `revealing` → `false`
  - `ballInTransit` → `null`
  - `transitProgress` → `0`
- ✅ Display ball disappears
- ✅ "Ready" / "Připraveno" text returns
- ✅ Inner balls continue sinking to bottom

---

## 📊 **TIMING CONSTANTS**

```typescript
SPIN_FAST_MS = 700ms       // Fast spin phase duration
SPIN_SLOW_MS = 600ms       // Slow spin phase duration
REVEAL_DELAY_MS = 1100ms   // Total time before ball reveals
BALL_TRANSIT_MS = 600ms    // Ball transit animation duration
```

**Total Animation Duration**: ~1100ms (1.1 seconds)

---

## 🎨 **VISUAL COMPONENTS SUMMARY**

| Component | Position | Color | Animation |
|-----------|----------|-------|-----------|
| **Drum (Dome)** | `y: 1.4` | Light blue (#87ceeb), 30% opacity | Rotates when spinning |
| **Base** | `y: -0.5` | Light blue (#87ceeb) | Static |
| **Display Panel** | `y: -0.35, z: 0.61` | Dark blue (#4682b4) | Static |
| **Landing Tray** | `y: -0.48, z: 0.65` | Light blue (#5a9bd4) with dark blue rim | Static |
| **Central Shaft** | `y: 0.1` | Light blue (#87ceeb) | Static |
| **Hub** | `y: 0.6` (group) | Light brown (#d2b48c) | Static |
| **Spokes** | On hub | Light brown (#d2b48c) | Static |
| **Inner Balls** | Random in dome | Varied (red, yellow, green, blue, orange, purple) | Random movement when spinning, sink when not |
| **Transit Ball** | Animated | Green (#22c55e) | Travels from tube to tray |
| **Display Ball** | `y: -0.45, z: 0.65` | Blue (#3b82f6) | Pulsing scale when revealed |

---

## 🔊 **AUDIO EVENTS**

| Event | Sound | Volume | Timing |
|-------|-------|--------|--------|
| Button Click | `click` | 0.1 | 0ms |
| Draw Ball (Backend) | `jingle` | 0.2 | ~100ms |
| Spin Start | `jingle` | 0.15 | 0ms (animation start) |
| Ball Pop/Reveal | `ding` | 0.2 | 1100ms |

---

## 📝 **STATE FLOW DIAGRAM**

```
[Initial Load]
  ↓
[Ready State]
  - displayBall: null
  - spinning: false
  - Inner balls: Sinking to bottom
  ↓
[Button Click]
  ↓
[currentBall Changes]
  ↓
[Phase 1: Fast Spin (0-700ms)]
  - spinning: true
  - spinPhase: 'fast'
  - Drum rotates fast
  - Inner balls: Random movement
  ↓
[Phase 2: Slow Spin (700-1100ms)]
  - spinPhase: 'slow'
  - Drum rotates slow
  - Inner balls: Slower random movement
  ↓
[Phase 3: Ball Transit (500-1100ms)]
  - ballInTransit: currentBall
  - transitProgress: 0 → 1
  - Green ball travels down tube
  ↓
[Phase 4: Reveal (1100ms)]
  - displayBall: currentBall
  - ballInTransit: null
  - revealing: true
  - Blue ball in tray, pulsing
  - Ball number text visible
  ↓
[Stop Spinning (1200ms)]
  - spinning: false
  - spinPhase: null
  - revealing: false
  - Inner balls: Start sinking
  ↓
[Final State]
  - Display ball visible in tray
  - Inner balls at bottom
  - Ready for next draw
```

---

## 🐛 **EDGE CASES**

1. **Multiple rapid clicks**: Protected by `busy` and `isDrawing` flags
2. **Ball becomes null**: All states reset, display ball disappears
3. **Animation interrupted**: Cleanup functions cancel timeouts and animation frames
4. **Scene error**: Falls back to "3D scene unavailable" message

