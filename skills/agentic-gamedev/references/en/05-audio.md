## 5. Zero-Asset Audio Synthesis (Web Audio API)

Synthesize all audio effects and background music procedurally using two core primitives:

```js
tone(freq, start, dur, type, vol, glideTo)  // Single oscillator + Gain Envelope
noise(start, dur, vol, freq, q)             // White Noise + Bandpass Filter
```

### 5.1 Audio Design Recipes

- **Success:** Ascending arpeggio (C-E-G-C).
- **Failure:** Soft descending tone (avoid harsh sound design on incorrect answers).
- **Hit Impact:** Short bandpass filtered noise with rate-limiting (45–70ms threshold).
- **Low HP Alarm:** Low-frequency heartbeat pulse + synchronized screen edge pulse.

### 5.2 6 Elements of Rich Synthesized BGM

Avoid monotone electronic beeps by combining:

1. **Chord Progressions:** Define explicit harmony progressions per bar (`[[0, MIN7], [-4, MAJ7], ...]`).
2. **Pads:** Layer 2 saw-wave oscillators detuned by ±6 cents through a low-pass filter.
3. **Arpeggios:** Traverse chord notes using index patterns (`[0,1,2,1,0,2]`).
4. **Bass:** Clean low-pass filtered root notes (kept dry).
5. **Drums:** Sine pitch drop (Kick), bandpass noise (Snare), high-pass noise (Hi-hat).
6. **Reverb:** Feedback delay + low-pass filter bus.

### 5.3 Mandatory Audio Mute Checklist

1. **Separate SFX and BGM Mutes:** Allow users to toggle music independently from sound effects.
2. **Visible HUD Toggle:** Place mute controls prominently in the main HUD using icon + text labels.
3. **Persist Settings:** Cache mute preferences in `localStorage`.
4. **Keyboard Shortcut:** Bind key `M` for instant audio toggling.
5. **Non-destructive Muters:** Check `if (muted) return;` at play time rather than closing `AudioContext`.

### 5.4 Master Chain: Limiter, Panning, and Pitch Jitter

- **Master Limiter:** Connect a `DynamicsCompressor` node to prevent clipping when multiple sounds overlap.
- **Stereo Panning:** Pipe entity X positions into a `StereoPanner` node (-0.85 to 0.85).
- **Pitch Jitter:** Apply random pitch variation (±40–90 cents) to prevent repetitive sound fatigue.

### 5.5 Cleaning Up Sustained Oscillators

Sustained sounds (e.g., charge attacks) must register cleanup calls across 3 distinct termination paths:
1. Normal key/mouse release handlers.
2. Pause and modal UI open events.
3. Component and scene unmount cleanup lifecycle hooks.

### 5.6 Sidechain BGM Ducking

When impact SFX overlap with active BGM frequencies, apply temporary sidechain ducking to dip BGM volume slightly rather than increasing SFX volume:

```js
export function duckBgm(amount = 0.4, dur = 0.4) {
  const t = c.currentTime;
  duckGain.gain.cancelScheduledValues(t);
  duckGain.gain.setValueAtTime(duckGain.gain.value, t);
  duckGain.gain.linearRampToValueAtTime(1 - amount, t + 0.04);
  duckGain.gain.exponentialRampToValueAtTime(1, t + dur);
}
```
