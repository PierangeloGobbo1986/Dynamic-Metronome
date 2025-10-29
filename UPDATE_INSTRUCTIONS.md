# Metronome Update Instructions

## Changes Made

### 1. Knob Sensitivity Adjustments
- **Beats/Bar knob**: Decreased sensitivity by 20% (0.30 → 0.24)
- **Bars/Tempo knob**: Increased sensitivity by 10% (0.20 → 0.22)
- **Start BPM knob**: Increased sensitivity by 10% (0.20 → 0.22)
- **End BPM knob**: Increased sensitivity by 10% (0.20 → 0.22)
- **Increment knob**: Unchanged (0.5)

### 2. Numpad Feature
- Tapping on any knob value now opens a numpad for direct value entry
- The numpad includes:
  - Number buttons 0-9
  - Clear button (C) to reset input
  - Backspace button (←) to delete last digit
  - Cancel button to close without changes
  - OK button to apply the new value
- The numpad validates that entered values are within the knob's min/max range

## How to Update Your GitHub Repository

### Option 1: Using GitHub Web Interface (Easiest)

1. **Go to your repository** on GitHub
   - Navigate to: `https://github.com/YOUR-USERNAME/metronome`

2. **Update script.js**:
   - Click on `script.js` in the file list
   - Click the pencil icon (✏️) to edit
   - Delete all the old content
   - Open the new `script.js` file from your downloads
   - Copy all content and paste it into GitHub
   - Scroll to bottom and click **Commit changes**

3. **Wait for deployment**:
   - GitHub Pages will automatically rebuild (takes 1-2 minutes)
   - Your metronome will be updated at: `https://YOUR-USERNAME.github.io/metronome/`

### Option 2: Using Git Command Line

If you have Git installed on your computer:

```bash
# Navigate to your local metronome directory
cd path/to/metronome

# Copy the new script.js file to your local directory
# (replace the old script.js with the new one)

# Add the changes
git add script.js

# Commit the changes
git commit -m "Update knob sensitivities and add numpad feature"

# Push to GitHub
git push origin main
```

### Option 3: Delete and Re-upload

1. Go to your repository on GitHub
2. Click on `script.js`
3. Click the trash icon to delete it
4. Click **Commit changes**
5. Go back to the main repository page
6. Click **Add file** → **Upload files**
7. Upload the new `script.js` file
8. Click **Commit changes**

## Testing the Changes

After updating, test the following:

1. **Knob Sensitivity**:
   - The Beats/Bar knob should feel less sensitive (requires more drag movement)
   - The Bars/Tempo, Start BPM, and End BPM knobs should feel more responsive

2. **Numpad Feature**:
   - Tap any knob value number
   - A numpad should appear with a golden border
   - Enter a number using the numpad
   - Click OK to apply or Cancel to dismiss
   - The value should update correctly

## Files Included

- `script.js` - **UPDATED** (modified sensitivities and added numpad)
- `index.html` - Unchanged
- `styles.css` - Unchanged
- `README.md` - Unchanged

## Troubleshooting

**Changes not showing up?**
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Wait 2-3 minutes for GitHub Pages to rebuild
- Try opening in an incognito/private window

**Numpad not appearing?**
- Make sure you're tapping directly on the number below the knob
- Check browser console for any errors (F12 → Console tab)

Enjoy your improved metronome! 🎵
