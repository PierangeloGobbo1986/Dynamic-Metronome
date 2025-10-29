# Dynamic Metronome Web App

A professional, guitar pedal-style metronome with three modes: Normal, Simple Ramp, and Complex Ramp.

## Features

- **Normal Mode**: Continuous metronome with adjustable tempo and beats/bar
- **Simple Ramp Mode**: Gradually increase/decrease tempo over time
- **Complex Ramp Mode**: Create multi-segment practice routines with different tempos and time signatures
- **Beat Visualization**: Tap any beat to toggle accents
- **Countdown**: Get ready bar before ramp modes start
- **Mobile Friendly**: Optimized for iPhone and touch devices
- **Precise Timing**: Uses Web Audio API for accurate beat timing

## Files Included

- `index.html` - Main HTML structure
- `styles.css` - Guitar pedal styling
- `script.js` - All metronome logic and controls

## Deployment to GitHub Pages

### Step 1: Upload Files to GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Create a new repository:
   - Click the **+** icon in top right
   - Select **New repository**
   - Name it: `metronome` (or any name you like)
   - Make it **Public**
   - Click **Create repository**

3. Upload the files:
   - Click **uploading an existing file**
   - Drag and drop these 3 files:
     - `index.html`
     - `styles.css`
     - `script.js`
   - Click **Commit changes**

### Step 2: Enable GitHub Pages

1. In your repository, click **Settings** (top menu)
2. Scroll down to **Pages** (left sidebar)
3. Under **Source**, select:
   - Branch: **main** (or **master**)
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Step 3: Access Your Metronome

Your metronome will be available at:
```
https://YOUR-USERNAME.github.io/metronome/
```

Replace `YOUR-USERNAME` with your GitHub username.

## Using on iPhone

### Add to Home Screen (Recommended)

1. Open the URL in **Safari** on your iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. The metronome now appears as an app icon!

### Features on iPhone

- Works offline after first load
- Full-screen app experience
- Touch-optimized controls
- Responsive design

## How to Use

### Normal Mode
1. Set **START BPM** (END BPM mirrors automatically)
2. Adjust **BEATS/BAR** if needed
3. Tap **START**
4. Adjust tempo or beats/bar live while playing!

### Simple Ramp Mode
1. Set **START BPM**
2. Set different **END BPM** (activates ramp mode)
3. Set **BPM INCREMENT** (how much tempo changes)
4. Set **BARS/TEMPO** (how many bars at each tempo)
5. Tap **START**

### Complex Ramp Mode
1. Set parameters for first segment
2. Tap **Save Segment**
3. Set parameters for next segment
4. Tap **Save Segment** again
5. Repeat as needed
6. Tap **START** to play all segments in sequence

### Beat Accents
- Tap any beat circle to toggle accent
- Accented beats play a higher-pitched sound
- Works in all modes!

## Troubleshooting

**No sound on iPhone?**
- Make sure your device is not on silent mode
- Check volume is turned up
- Tap START - sound requires user interaction first

**Knobs not responding?**
- Try dragging up/down on the knob
- On mobile, use touch and drag vertically

**Page won't load?**
- Make sure all 3 files are uploaded
- Check that GitHub Pages is enabled
- Wait a few minutes after deployment

## Support

For issues or questions, please open an issue on the GitHub repository.

Enjoy your practice sessions! 🎵
