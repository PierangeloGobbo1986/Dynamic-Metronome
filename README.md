# Dynamic Metronome Web App

A professional, guitar pedal-style metronome with three operating modes and advanced beat control features.

**Copyright (c) 2025 [Your Name]. All Rights Reserved.**

---

## 🎵 Features

### Three Operating Modes:
- **Normal Mode** - Continuous metronome with live tempo adjustment
- **Simple Ramp Mode** - Gradually increase/decrease tempo over time
- **Complex Ramp Mode** - Create multi-segment practice routines with different tempos and time signatures

### Advanced Beat Control:
- **Three-State Beat System** - Each beat can be Normal, Accented, or Muted
- **Visual Feedback** - Color-coded dots show beat states and current position
- **Custom Patterns** - Create complex rhythmic patterns by tapping beats

### Multiple Sound Options:
- **4 Built-in Sounds** - Classic, Woodblock, Click, and Beep
- **Customizable** - Easy to modify or add your own sounds
- **Synthesized Audio** - No audio files needed, works offline

### Mobile-Optimized:
- **Touch-Friendly** - Large controls optimized for iPhone and tablets
- **Responsive Design** - Works on all screen sizes
- **Add to Home Screen** - Install as a web app on iOS
- **Precise Timing** - Web Audio API for accurate beat timing

---

## 📱 Quick Start

### Using the App:

**Normal Mode** (Simple Metronome):
1. Set **Start BPM** to your desired tempo
2. Adjust **Beats/Bar** if needed (default is 4)
3. Tap beats to set accents or mute them
4. Press **START**
5. Adjust tempo or beats while playing!

**Simple Ramp Mode** (Tempo Change):
1. Set **Start BPM** (e.g., 60)
2. Set **End BPM** to different value (e.g., 120)
3. Set **BPM Increment** (e.g., 5) - how much tempo increases each time
4. Set **Bars/Tempo** (e.g., 4) - how many bars at each tempo
5. Press **START** - you'll get a countdown, then the tempo will gradually increase

**Complex Ramp Mode** (Multi-Segment Practice):
1. Configure first segment parameters
2. Press **Save Segment**
3. Configure next segment parameters
4. Press **Save Segment** again
5. Repeat as needed
6. Press **START** to play all segments in sequence

### Beat Control:

**Tap any beat dot to cycle through states:**
- **Normal** - Light grey, plays regular sound
- **Accent** - Gold outline, plays higher-pitched sound
- **Muted** - Very dark, completely silent

Perfect for:
- Creating complex rhythmic patterns
- Practicing with partial metronome support
- Building rhythmic independence
- Custom accent patterns (not just beat 1)

---

## 🎛️ Controls

### Knobs (Top Section):

**First Row:**
- **Start BPM** (40-400) - Initial tempo or only tempo in normal mode
- **End BPM** (40-400) - Final tempo for ramp modes

**Second Row:**
- **BPM Increment** (0-50) - How much tempo changes each step
- **Bars/Tempo** (1-100) - Number of bars to play at each tempo
- **Beats/Bar** (1-12) - Time signature (4 = 4/4, 3 = 3/4, etc.)

**Tips:**
- Drag knobs up/down to adjust
- Tap the number below each knob for direct entry (numpad)
- Start and End BPM sync automatically in normal mode

### Buttons:

- **START/STOP** - Begin or stop the metronome
- **Save Segment** - Add current settings as a segment
- **Remove Last** - Delete the most recent segment
- **Clear All** - Remove all saved segments

---

## 🔊 Sound Styles

The metronome includes 4 different sound options:

1. **Classic** (default) - Smooth sine wave tones
2. **Woodblock** - Percussive wood block simulation
3. **Click** - Sharp, precise click sound
4. **Beep** - Electronic triangle wave beep

### How to Change Sound:

Edit `script.js` and add this line near the beginning (around line 22):

```javascript
this.soundStyle = 'woodblock'; // or 'click', 'beep', 'classic'
```

**For example:**
```javascript
constructor() {
    // Audio context
    this.audioContext = null;
    this.soundStyle = 'woodblock'; // Add this line
    
    // State
    this.isRunning = false;
    ...
```

Save the file and refresh your browser!

---

## 🚀 Deployment to GitHub Pages

### Step 1: Create Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon (top right) → **New repository**
3. Name it: `dynamic-metronome` (or any name)
4. **Check "Private"** if you want to protect your code
5. Click **Create repository**

### Step 2: Update Copyright Information

Before uploading, **replace placeholders** in all files:
- `[Your Name]` → Your actual name
- `[your.email@example.com]` → Your email address

### Step 3: Upload Files

Upload these files to your repository:
- `index.html`
- `script.js`
- `styles.css`
- `LICENSE`

**Methods:**
- Click **"uploading an existing file"** and drag/drop
- Or use Git command line
- Or use GitHub Desktop app

### Step 4: Enable GitHub Pages

1. Go to repository **Settings**
2. Click **Pages** in left sidebar
3. Under **Source**, select:
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Step 5: Access Your Metronome

Your app will be live at:
```
https://YOUR-USERNAME.github.io/REPO-NAME/
```

**Note:** Even with a private repository, the GitHub Pages site is public. This means:
- ✅ Your code in the repo is **hidden** (protected)
- ✅ The deployed website is **public** (shareable)
- ✅ People with the link can use your metronome
- ⚠️ Users can view source in browser (unavoidable for web apps)

---

## 📱 Using on iPhone/iPad

### Add to Home Screen (Recommended):

1. Open the URL in **Safari**
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**
5. The metronome now appears as an app icon!

### Benefits:
- Works offline after first load
- Full-screen app experience
- No browser UI clutter
- Quick access from home screen

### Troubleshooting:

**No sound on iPhone?**
- Disable silent mode (check switch on side)
- Turn up volume
- Tap START (iOS requires user interaction for audio)

**Knobs not responding?**
- Drag up/down on the knob
- Or tap the number for direct entry

**Page won't load?**
- Wait a few minutes after enabling GitHub Pages
- Check that all files are uploaded
- Clear Safari cache

---

## 📁 Files Included

- `index.html` - Main HTML structure with copyright notice
- `styles.css` - Guitar pedal styling with copyright notice
- `script.js` - Metronome logic and controls with copyright notice
- `LICENSE` - Proprietary software license
- `README.md` - This file
- `NEW_FEATURES.md` - Detailed documentation of beat states and sounds
- `COPYRIGHT_INSTRUCTIONS.md` - Legal protection setup guide

---

## 🎼 Use Cases

### For Musicians:
- Practice scales and exercises with gradual tempo increases
- Build rhythmic independence by muting certain beats
- Create complex practice routines with multiple segments
- Work on odd time signatures (5/4, 7/8, etc.)

### For Music Teachers:
- Design custom practice routines for students
- Demonstrate tempo progression
- Teach polyrhythms and independence
- Share practice links with students

### For Drummers:
- Practice fills with muted beats
- Work on ghost notes (muted beats)
- Build coordination with custom accent patterns
- Tempo training for speed development

---

## 🛠️ Customization

### Creating Custom Sounds:

The code includes example sound functions you can modify:
- `playClassicClick()` - Simple sine waves
- `playWoodblock()` - Multiple harmonics
- `playSharpClick()` - Square wave clicks
- `playBeep()` - Triangle wave beeps

**Parameters you can adjust:**
- `frequency.value` - Pitch in Hz (higher = higher pitch)
- `osc.type` - Waveform: 'sine', 'square', 'triangle', 'sawtooth'
- Duration - How long the sound lasts
- Volume (gain) - How loud the sound is

### Changing Colors:

Edit `styles.css` to customize:
- Pedal color: `.pedal-container` background
- LED colors: `.led.active` background
- Button colors: `.control-button` background
- Any visual element

### Adding Features:

The code is well-commented and organized. You can:
- Add more sound styles
- Create preset patterns
- Add save/load functionality with localStorage
- Implement export of practice routines
- Add more complex time signature support

---

## 🔒 Copyright & License

**Copyright (c) 2025 [Your Name]. All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited without explicit permission.

See the `LICENSE` file for full terms.

For licensing inquiries: [your.email@example.com]

---

## 📊 Technical Details

### Built With:
- **Vanilla JavaScript** - No frameworks needed
- **Web Audio API** - Precise timing and sound synthesis
- **HTML5 Canvas** - Custom knob graphics and beat visualization
- **CSS3** - Responsive guitar pedal design

### Browser Compatibility:
- ✅ Chrome/Edge (recommended)
- ✅ Safari (iOS and macOS)
- ✅ Firefox
- ⚠️ Older browsers may not support Web Audio API

### Performance:
- Timing precision: ~1ms accuracy
- Resource usage: Minimal CPU/memory
- Offline capable: Works without internet after first load
- File size: < 50KB total

---

## 🐛 Troubleshooting

**Metronome stops or freezes:**
- Close other browser tabs
- Refresh the page
- Check that iOS Safari isn't in Low Power Mode

**Timing seems off:**
- Close other resource-heavy applications
- Use Chrome/Safari (best audio performance)
- Check that system audio latency is low

**Beat dots not responding:**
- Increase tap radius in code if needed
- Try tapping more precisely on the dots
- Use a stylus on touch devices

**Knobs too sensitive/not sensitive enough:**
- Sensitivity values can be adjusted in the code
- Line ~165-167 in script.js

---

## 🤝 Support

For questions, bugs, or feature requests:
- Contact: [your.email@example.com]
- Check `NEW_FEATURES.md` for detailed feature documentation
- Check `COPYRIGHT_INSTRUCTIONS.md` for deployment help

---

## 📝 Changelog

### Version 1.1 (October 2025)
- Added three-state beat system (normal/accent/muted)
- Added multiple sound style options
- Reorganized knob layout for better workflow
- Added copyright protection
- Improved mobile tap detection

### Version 1.0 (October 2025)
- Initial release
- Three operating modes
- Custom beat patterns
- Mobile-optimized interface
- GitHub Pages deployment

---

## 🎵 Enjoy Your Practice!

This metronome was designed by musicians, for musicians. Whether you're working on speed, independence, or complex rhythms, this tool has you covered.

Happy practicing! 🎸🥁🎹

---

**Copyright (c) 2025 [Your Name]. All Rights Reserved.**
