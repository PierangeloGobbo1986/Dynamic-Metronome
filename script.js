// Dynamic Metronome - Web Version
// ==================================

class DynamicMetronome {
    constructor() {
        // Audio context
        this.audioContext = null;
        this.accentFreq = 1000;
        this.normalFreq = 800;
        
        // State
        this.isRunning = false;
        this.currentTempo = 120;
        this.currentBeatsPerBar = null;
        this.currentSegmentIndex = -1;
        this.accentBeats = new Set([1]);
        this.tempoSegments = [];
        this.endBpmManuallyChanged = false;
        
        // Timing
        this.nextBeatTime = 0;
        this.timerInterval = null;
        this.sessionStartTime = 0;
        this.totalTime = 0;
        
        // Knob values
        this.knobs = {
            beats: 4,
            bars: 1,
            startBpm: 120,
            endBpm: 120,
            increment: 0
        };
        
        // Initialize
        this.initAudio();
        this.initKnobs();
        this.initBeatCanvas();
        this.initButtons();
        this.updateModeIndicators();
        this.updateBeatDisplay();
    }
    
    initAudio() {
        // Create audio context on first user interaction
        document.addEventListener('touchstart', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
        
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    playClick(isAccent) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc.frequency.value = isAccent ? this.accentFreq : this.normalFreq;
        osc.type = 'sine';
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    // Knob Class
    createKnob(canvasId, valueId, min, max, initial, onChange) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const valueDisplay = document.getElementById(valueId);
        
        let value = initial;
        let isDragging = false;
        let lastY = 0;
        
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Shadow
            ctx.fillStyle = '#1C1C1C';
            ctx.beginPath();
            ctx.arc(60, 60, 55, 0, Math.PI * 2);
            ctx.fill();
            
            // Main body
            ctx.fillStyle = '#2C2C2C';
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(60, 60, 52, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Inner circle
            ctx.fillStyle = '#8C8C8C';
            ctx.strokeStyle = '#6C6C6C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(60, 60, 36, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Pointer
            const normalized = (value - min) / (max - min);
            const angle = -135 + normalized * 270;
            const rad = angle * Math.PI / 180;
            
            const startR = 18;
            const endR = 44;
            const x1 = 60 + startR * Math.sin(rad);
            const y1 = 60 - startR * Math.cos(rad);
            const x2 = 60 + endR * Math.sin(rad);
            const y2 = 60 - endR * Math.cos(rad);
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            valueDisplay.textContent = Math.round(value);
        };
        
        const handleStart = (e) => {
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            lastY = touch.clientY;
            e.preventDefault();
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            const touch = e.touches ? e.touches[0] : e;
            const dy = lastY - touch.clientY;
            lastY = touch.clientY;
            
            // Adjusted sensitivities: beats/bar = 0.25 (easier to adjust), bars/tempo, start/end BPM = 0.7
            const sensitivity = canvasId === 'beatsKnob' ? 0.25 : 
                              canvasId === 'incrementKnob' ? 0.5 : 0.7;
            const change = dy * sensitivity;
            
            value = Math.max(min, Math.min(max, value + change));
            value = Math.round(value);
            
            draw();
            if (onChange) onChange(value);
            
            e.preventDefault();
        };
        
        const handleEnd = () => {
            isDragging = false;
        };
        
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        
        // Numpad functionality for direct value entry
        const showNumpad = () => {
            // Remove any existing numpad
            const existingNumpad = document.getElementById('numpad-modal');
            if (existingNumpad) {
                existingNumpad.remove();
            }
            
            // Create numpad modal
            const modal = document.createElement('div');
            modal.id = 'numpad-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            
            const numpadContainer = document.createElement('div');
            numpadContainer.style.cssText = `
                background: #2C2C2C;
                border: 3px solid #E8A317;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
            `;
            
            // Current input display
            let inputValue = '';
            const inputDisplay = document.createElement('div');
            inputDisplay.style.cssText = `
                background: #1C1C1C;
                color: #00FF00;
                font-family: 'Courier New', monospace;
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                min-height: 50px;
                min-width: 200px;
            `;
            inputDisplay.textContent = value.toString();
            numpadContainer.appendChild(inputDisplay);
            
            // Numpad grid
            const numpadGrid = document.createElement('div');
            numpadGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 10px;
            `;
            
            // Create number buttons 1-9
            for (let i = 1; i <= 9; i++) {
                const btn = createNumpadButton(i.toString());
                btn.onclick = () => {
                    if (inputValue === '' || inputValue === '0') {
                        inputValue = i.toString();
                    } else {
                        inputValue += i.toString();
                    }
                    inputDisplay.textContent = inputValue;
                };
                numpadGrid.appendChild(btn);
            }
            
            // Bottom row: Clear, 0, Backspace
            const clearBtn = createNumpadButton('C');
            clearBtn.onclick = () => {
                inputValue = '';
                inputDisplay.textContent = '0';
            };
            numpadGrid.appendChild(clearBtn);
            
            const zeroBtn = createNumpadButton('0');
            zeroBtn.onclick = () => {
                if (inputValue !== '') {
                    inputValue += '0';
                    inputDisplay.textContent = inputValue;
                }
            };
            numpadGrid.appendChild(zeroBtn);
            
            const backBtn = createNumpadButton('←');
            backBtn.onclick = () => {
                if (inputValue.length > 0) {
                    inputValue = inputValue.slice(0, -1);
                    inputDisplay.textContent = inputValue || '0';
                }
            };
            numpadGrid.appendChild(backBtn);
            
            numpadContainer.appendChild(numpadGrid);
            
            // Action buttons
            const actionRow = document.createElement('div');
            actionRow.style.cssText = `
                display: flex;
                gap: 10px;
                margin-top: 10px;
            `;
            
            const cancelBtn = createActionButton('Cancel');
            cancelBtn.onclick = () => {
                modal.remove();
            };
            actionRow.appendChild(cancelBtn);
            
            const okBtn = createActionButton('OK');
            okBtn.onclick = () => {
                const newValue = parseInt(inputValue || value.toString());
                if (!isNaN(newValue) && newValue >= min && newValue <= max) {
                    value = newValue;
                    draw();
                    if (onChange) onChange(value);
                    modal.remove();
                } else {
                    alert(`Value must be between ${min} and ${max}`);
                }
            };
            actionRow.appendChild(okBtn);
            
            numpadContainer.appendChild(actionRow);
            modal.appendChild(numpadContainer);
            document.body.appendChild(modal);
            
            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        };
        
        function createNumpadButton(text) {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                background: #CCCCCC;
                border: 2px solid #999;
                border-radius: 8px;
                font-size: 24px;
                font-weight: bold;
                color: #4C4C4C;
                padding: 15px;
                cursor: pointer;
                transition: all 0.1s;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            `;
            
            const pressEffect = () => {
                btn.style.background = '#AAAAAA';
                btn.style.transform = 'translateY(2px)';
            };
            
            const releaseEffect = () => {
                btn.style.background = '#CCCCCC';
                btn.style.transform = 'translateY(0)';
            };
            
            btn.addEventListener('mousedown', pressEffect);
            btn.addEventListener('mouseup', releaseEffect);
            btn.addEventListener('mouseleave', releaseEffect);
            
            // Don't use preventDefault on touch events - it blocks the click!
            btn.addEventListener('touchstart', pressEffect);
            btn.addEventListener('touchend', releaseEffect);
            
            return btn;
        }
        
        function createActionButton(text) {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                background: #E8A317;
                border: 2px solid #B87A0F;
                border-radius: 8px;
                font-size: 18px;
                font-weight: bold;
                color: #1C1C1C;
                padding: 12px 30px;
                cursor: pointer;
                flex: 1;
                transition: all 0.1s;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            `;
            
            const pressEffect = () => {
                btn.style.background = '#B87A0F';
                btn.style.transform = 'translateY(2px)';
            };
            
            const releaseEffect = () => {
                btn.style.background = '#E8A317';
                btn.style.transform = 'translateY(0)';
            };
            
            btn.addEventListener('mousedown', pressEffect);
            btn.addEventListener('mouseup', releaseEffect);
            btn.addEventListener('mouseleave', releaseEffect);
            
            // Don't use preventDefault on touch events - it blocks the click!
            btn.addEventListener('touchstart', pressEffect);
            btn.addEventListener('touchend', releaseEffect);
            
            return btn;
        }
        
        // Add click handler to value display - make it very tappable
        valueDisplay.style.cursor = 'pointer';
        valueDisplay.style.pointerEvents = 'auto'; // Override CSS pointer-events: none
        valueDisplay.style.padding = '8px 16px'; // Increase tappable area
        valueDisplay.style.margin = '-8px -16px'; // Compensate for padding to keep visual position
        valueDisplay.style.minWidth = '40px'; // Ensure minimum tappable width
        valueDisplay.style.minHeight = '20px'; // Ensure minimum tappable height
        valueDisplay.style.borderRadius = '4px'; // Rounded corners
        valueDisplay.style.transition = 'all 0.1s'; // Smooth feedback
        valueDisplay.style.userSelect = 'none'; // Prevent text selection
        valueDisplay.style.webkitUserSelect = 'none'; // Safari
        valueDisplay.style.webkitTapHighlightColor = 'rgba(232, 163, 23, 0.3)'; // iOS tap highlight
        
        // Add visual feedback on hover/press
        const showTapFeedback = () => {
            valueDisplay.style.backgroundColor = 'rgba(232, 163, 23, 0.3)';
            valueDisplay.style.transform = 'scale(1.1)';
        };
        
        const hideTapFeedback = () => {
            valueDisplay.style.backgroundColor = 'transparent';
            valueDisplay.style.transform = 'scale(1)';
        };
        
        // Mouse events
        valueDisplay.addEventListener('mouseenter', () => {
            valueDisplay.style.backgroundColor = 'rgba(232, 163, 23, 0.15)';
        });
        
        valueDisplay.addEventListener('mouseleave', hideTapFeedback);
        
        valueDisplay.addEventListener('mousedown', (e) => {
            showTapFeedback();
        });
        
        valueDisplay.addEventListener('mouseup', hideTapFeedback);
        
        valueDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showNumpad();
            setTimeout(hideTapFeedback, 100);
        });
        
        // Touch events - more sensitive
        valueDisplay.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            showTapFeedback();
            // Trigger numpad immediately on touch
            showNumpad();
            setTimeout(hideTapFeedback, 150);
        }, { passive: false });
        
        draw();
        
        return { getValue: () => value, setValue: (v) => { value = v; draw(); } };
    }
    
    initKnobs() {
        this.knobControls = {
            beats: this.createKnob('beatsKnob', 'beatsValue', 1, 12, 4, (v) => {
                this.knobs.beats = v;
                this.updateBeatDisplay();
            }),
            bars: this.createKnob('barsKnob', 'barsValue', 1, 100, 1, (v) => {
                this.knobs.bars = v;
            }),
            startBpm: this.createKnob('startBpmKnob', 'startBpmValue', 40, 400, 120, (v) => {
                this.knobs.startBpm = v;
                this.knobControls.endBpm.setValue(v);
                this.knobs.endBpm = v;
                this.endBpmManuallyChanged = false;
                this.currentTempo = v;
                this.updateModeIndicators();
            }),
            endBpm: this.createKnob('endBpmKnob', 'endBpmValue', 40, 400, 120, (v) => {
                this.knobs.endBpm = v;
                this.endBpmManuallyChanged = true;
                this.updateModeIndicators();
            }),
            increment: this.createKnob('incrementKnob', 'incrementValue', 0, 50, 0, (v) => {
                this.knobs.increment = v;
                this.updateModeIndicators();
            })
        };
    }
    
    initBeatCanvas() {
        const canvas = document.getElementById('beatCanvas');
        canvas.addEventListener('click', (e) => this.handleBeatClick(e));
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickEvent = {
                offsetX: (touch.clientX - rect.left) * scaleX,
                offsetY: (touch.clientY - rect.top) * scaleY
            };
            this.handleBeatClick(clickEvent);
        }, { passive: false });
    }
    
    handleBeatClick(e) {
        const beatsPerBar = this.currentBeatsPerBar || this.knobs.beats;
        const spacing = 400 / (beatsPerBar + 1);
        
        for (let i = 0; i < beatsPerBar; i++) {
            const x = spacing * (i + 1);
            const dx = e.offsetX - x;
            const dy = e.offsetY - 40;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Increased tap radius from 12 to 25 pixels for easier tapping
            if (distance <= 25) {
                const beatNum = i + 1;
                if (this.accentBeats.has(beatNum)) {
                    this.accentBeats.delete(beatNum);
                } else {
                    this.accentBeats.add(beatNum);
                }
                
                // Update display immediately
                this.updateBeatDisplay();
                break;
            }
        }
    }
    
    updateBeatDisplay(activeBeat = null) {
        const canvas = document.getElementById('beatCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const beatsPerBar = this.currentBeatsPerBar || this.knobs.beats;
        const spacing = 400 / (beatsPerBar + 1);
        const dotRadius = 12;
        const y = 40;
        
        for (let i = 0; i < beatsPerBar; i++) {
            const x = spacing * (i + 1);
            const beatNum = i + 1;
            const isAccent = this.accentBeats.has(beatNum);
            
            let color, outline, outlineWidth;
            if (activeBeat !== null && i === activeBeat) {
                color = '#00FF00';
                outline = '#00AA00';
                outlineWidth = 3;
            } else if (isAccent) {
                color = '#4C4C4C';
                outline = '#FFD700';
                outlineWidth = 3;
            } else {
                color = '#3C3C3C';
                outline = '#666666';
                outlineWidth = 2;
            }
            
            ctx.fillStyle = color;
            ctx.strokeStyle = outline;
            ctx.lineWidth = outlineWidth;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#999999';
            ctx.font = 'bold 10px Helvetica';
            ctx.textAlign = 'center';
            ctx.fillText(beatNum, x, y + 30);
        }
    }
    
    updateModeIndicators() {
        const normalLed = document.getElementById('normalLed');
        const simpleLed = document.getElementById('simpleLed');
        const complexLed = document.getElementById('complexLed');
        
        normalLed.classList.remove('active');
        simpleLed.classList.remove('active');
        complexLed.classList.remove('active');
        
        if (this.tempoSegments.length > 0) {
            complexLed.classList.add('active');
        } else if (this.knobs.startBpm !== this.knobs.endBpm && this.knobs.increment !== 0) {
            simpleLed.classList.add('active');
        } else {
            normalLed.classList.add('active');
        }
    }
    
    initButtons() {
        document.getElementById('startStopButton').addEventListener('click', () => this.toggleMetronome());
        document.getElementById('saveButton').addEventListener('click', () => this.saveSegment());
        document.getElementById('removeButton').addEventListener('click', () => this.removeLastSegment());
        document.getElementById('clearButton').addEventListener('click', () => this.clearSegments());
    }
    
    toggleMetronome() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    async start() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume audio context for iOS (minimal fix)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        const startBpm = this.knobs.startBpm;
        const endBpm = this.knobs.endBpm;
        const increment = this.knobs.increment;
        
        // Validate
        if (this.tempoSegments.length === 0 && startBpm !== endBpm && increment === 0) {
            alert('BPM Increment Required\n\nStart and End BPM parameters are different.\n\nEither:\n• Set a BPM increment to use tempo ramp mode, or\n• Set Start and End BPM to the same value to use normal metronome mode');
            return;
        }
        
        if (startBpm === endBpm) {
            this.currentTempo = startBpm;
        }
        
        this.isRunning = true;
        document.getElementById('startStopButton').textContent = 'STOP';
        document.getElementById('startStopButton').classList.add('running');
        
        // Set beats per bar for complex mode
        if (this.tempoSegments.length > 0) {
            this.currentBeatsPerBar = this.tempoSegments[0].beats;
            this.updateBeatDisplay();
        } else {
            this.currentBeatsPerBar = null;
        }
        
        // Calculate and display total time
        this.totalTime = this.calculateTotalTime();
        if (this.totalTime > 0) {
            document.getElementById('timerDisplay').textContent = this.formatTime(this.totalTime);
        } else {
            document.getElementById('timerDisplay').textContent = '∞';
        }
        
        this.sessionStartTime = Date.now();
        this.runMetronome();
    }
    
    stop() {
        this.isRunning = false;
        document.getElementById('startStopButton').textContent = 'START';
        document.getElementById('startStopButton').classList.remove('running');
        document.getElementById('readyDisplay').textContent = 'Ready';
        document.getElementById('timerDisplay').textContent = '00:00';
        this.currentBeatsPerBar = null;
        this.updateBeatDisplay();
        this.currentSegmentIndex = -1;
        this.updateSegmentsDisplay();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    async runMetronome() {
        const startBpm = this.knobs.startBpm;
        const endBpm = this.knobs.endBpm;
        const beatsPerBar = this.knobs.beats;
        
        let segments, normalMode, complexMode;
        
        if (this.tempoSegments.length > 0) {
            segments = this.tempoSegments;
            normalMode = false;
            complexMode = true;
        } else {
            if (startBpm === endBpm) {
                normalMode = true;
                complexMode = false;
                segments = [{
                    start: startBpm,
                    end: startBpm,
                    bars: 1,
                    beats: beatsPerBar,
                    increment: 1
                }];
            } else {
                normalMode = false;
                complexMode = false;
                segments = [{
                    start: startBpm,
                    end: endBpm,
                    bars: this.knobs.bars,
                    beats: beatsPerBar,
                    increment: this.knobs.increment
                }];
            }
        }
        
        this.nextBeatTime = this.audioContext.currentTime;
        let globalBeatCount = 0;
        let lastBpmUpdate = 0;
        
        // Countdown for ramp modes
        if (!normalMode) {
            const countdownBpm = segments[0].start;
            const countdownBeats = segments[0].beats;
            const beatInterval = 60.0 / countdownBpm;
            
            lastBpmUpdate = 0;
            
            // Show GET READY
            document.getElementById('readyDisplay').textContent = 'GET READY!';
            await this.sleep(1000);
            
            this.nextBeatTime = this.audioContext.currentTime;
            
            // Countdown bar
            for (let beatNum = 0; beatNum < countdownBeats; beatNum++) {
                if (!this.isRunning) return;
                
                const beatInBar = beatNum + 1;
                const countdownNumber = -(countdownBeats - beatNum);
                
                // Wait for beat
                while (this.audioContext.currentTime < this.nextBeatTime) {
                    await this.sleep(1);
                }
                
                // Play sound
                this.playClick(this.accentBeats.has(beatInBar));
                
                // Update display
                document.getElementById('readyDisplay').textContent = countdownNumber;
                this.updateBeatDisplay(beatNum);
                
                this.nextBeatTime += beatInterval;
            }
        }
        
        // Start timer for ramp modes
        if (!normalMode) {
            this.timerInterval = setInterval(() => {
                if (!this.isRunning) return;
                const elapsed = (Date.now() - this.sessionStartTime) / 1000;
                const remaining = Math.max(0, this.totalTime - elapsed);
                document.getElementById('timerDisplay').textContent = this.formatTime(remaining);
            }, 500);
        }
        
        // Process segments
        for (let segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
            if (!this.isRunning) break;
            
            const segment = segments[segmentIdx];
            
            if (complexMode) {
                this.currentSegmentIndex = segmentIdx + 1;
                this.updateSegmentsDisplay(this.currentSegmentIndex);
            }
            
            const startBpmSeg = segment.start;
            const endBpmSeg = segment.end;
            const increment = segment.increment;
            let beatsPerBarSeg = segment.beats;
            const barsPerTempo = segment.bars;
            
            // Update beat display if beats changed
            if (complexMode) {
                if (this.currentBeatsPerBar !== beatsPerBarSeg) {
                    this.currentBeatsPerBar = beatsPerBarSeg;
                    this.updateBeatDisplay();
                } else {
                    this.currentBeatsPerBar = beatsPerBarSeg;
                }
            }
            
            // Build tempo list
            let tempoList = [];
            if (normalMode) {
                tempoList = [startBpmSeg];
            } else {
                if (startBpmSeg === endBpmSeg) {
                    tempoList = [startBpmSeg];
                } else if (startBpmSeg < endBpmSeg) {
                    let current = startBpmSeg;
                    while (current <= endBpmSeg) {
                        tempoList.push(current);
                        current += increment;
                    }
                } else {
                    let current = startBpmSeg;
                    while (current >= endBpmSeg) {
                        tempoList.push(current);
                        current -= increment;
                    }
                }
            }
            
            // Play through tempos
            let tempoIndex = 0;
            while (this.isRunning) {
                let tempo;
                if (normalMode) {
                    tempo = this.currentTempo;
                    beatsPerBarSeg = this.knobs.beats;
                } else {
                    if (tempoIndex >= tempoList.length) break;
                    tempo = tempoList[tempoIndex];
                    tempoIndex++;
                }
                
                // Update display for normal mode
                if (normalMode && tempo !== lastBpmUpdate) {
                    lastBpmUpdate = tempo;
                    document.getElementById('readyDisplay').textContent = `${tempo} BPM`;
                }
                
                const beatInterval = 60.0 / tempo;
                const totalBeats = normalMode ? beatsPerBarSeg : (barsPerTempo * beatsPerBarSeg);
                
                // Play beats
                for (let beatNum = 0; beatNum < totalBeats; beatNum++) {
                    if (!this.isRunning) break;
                    
                    if (normalMode) {
                        tempo = this.currentTempo;
                        beatsPerBarSeg = this.knobs.beats;
                        if (tempo !== lastBpmUpdate) {
                            lastBpmUpdate = tempo;
                            document.getElementById('readyDisplay').textContent = `${tempo} BPM`;
                        }
                    }
                    
                    const beatInBar = (beatNum % beatsPerBarSeg) + 1;
                    
                    // Wait for beat time
                    while (this.audioContext.currentTime < this.nextBeatTime) {
                        await this.sleep(1);
                    }
                    
                    // Play sound
                    this.playClick(this.accentBeats.has(beatInBar));
                    
                    // Update BPM display on beat 1 for ramp modes
                    if (!normalMode && beatInBar === 1 && tempo !== lastBpmUpdate) {
                        lastBpmUpdate = tempo;
                        document.getElementById('readyDisplay').textContent = `${tempo} BPM`;
                    }
                    
                    // Update beat display
                    this.updateBeatDisplay(beatInBar - 1);
                    
                    this.nextBeatTime += 60.0 / tempo;
                    globalBeatCount++;
                }
                
                if (normalMode) continue;
            }
        }
        
        if (complexMode) {
            this.currentSegmentIndex = -1;
            this.updateSegmentsDisplay();
        }
        
        if (this.isRunning && !normalMode) {
            this.stop();
            document.getElementById('readyDisplay').textContent = 'Complete!';
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    calculateTotalTime() {
        let segments;
        let isRampMode = false;
        
        if (this.tempoSegments.length > 0) {
            segments = this.tempoSegments;
            isRampMode = true;
        } else {
            const startBpm = this.knobs.startBpm;
            const endBpm = this.knobs.endBpm;
            
            if (startBpm === endBpm) {
                return 0; // Infinite
            }
            
            segments = [{
                start: startBpm,
                end: endBpm,
                bars: this.knobs.bars,
                beats: this.knobs.beats,
                increment: this.knobs.increment
            }];
            isRampMode = true;
        }
        
        let totalSeconds = 0;
        
        for (const segment of segments) {
            const startBpm = segment.start;
            const endBpm = segment.end;
            const increment = segment.increment;
            const beatsPerBar = segment.beats;
            const barsPerTempo = segment.bars;
            const totalBeatsPerTempo = beatsPerBar * barsPerTempo;
            
            if (startBpm === endBpm) {
                totalSeconds += totalBeatsPerTempo / (startBpm / 60.0);
            } else {
                if (startBpm < endBpm) {
                    let currentBpm = startBpm;
                    while (currentBpm <= endBpm) {
                        totalSeconds += totalBeatsPerTempo / (currentBpm / 60.0);
                        currentBpm += increment;
                    }
                } else {
                    let currentBpm = startBpm;
                    while (currentBpm >= endBpm) {
                        totalSeconds += totalBeatsPerTempo / (currentBpm / 60.0);
                        currentBpm -= increment;
                    }
                }
            }
        }
        
        // Add countdown time
        if (isRampMode && segments.length > 0) {
            const firstSegment = segments[0];
            const beatsPerBar = firstSegment.beats;
            const countdownBpm = firstSegment.start;
            const countdownTime = beatsPerBar / (countdownBpm / 60.0);
            totalSeconds += countdownTime + 1.0; // +1 for GET READY
        }
        
        return totalSeconds;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    saveSegment() {
        const startBpm = this.knobs.startBpm;
        const endBpm = this.knobs.endBpm;
        const increment = this.knobs.increment;
        
        if (startBpm !== endBpm && increment === 0) {
            alert('BPM Increment Required\n\nStart and End BPM parameters are different.\n\nEither:\n• Set a BPM increment to use tempo ramp mode, or\n• Set Start and End BPM to the same value to use normal metronome mode');
            return;
        }
        
        this.tempoSegments.push({
            start: startBpm,
            end: endBpm,
            bars: this.knobs.bars,
            beats: this.knobs.beats,
            increment: increment
        });
        
        this.updateSegmentsDisplay();
        this.updateModeIndicators();
    }
    
    removeLastSegment() {
        if (this.tempoSegments.length > 0) {
            this.tempoSegments.pop();
            this.updateSegmentsDisplay();
            this.updateModeIndicators();
        } else {
            alert('No segments to remove.');
        }
    }
    
    clearSegments() {
        if (this.tempoSegments.length > 0) {
            if (confirm('Clear all saved tempo segments?')) {
                this.tempoSegments = [];
                this.updateSegmentsDisplay();
                this.updateModeIndicators();
            }
        }
    }
    
    updateSegmentsDisplay(highlightIndex = -1) {
        const display = document.getElementById('segmentsDisplay');
        display.innerHTML = '';
        
        this.tempoSegments.forEach((seg, idx) => {
            const div = document.createElement('div');
            div.className = 'segment-line';
            if (idx + 1 === highlightIndex) {
                div.classList.add('current');
            }
            
            let text;
            if (seg.start === seg.end) {
                text = `${idx + 1}. ${seg.start} BPM, ${seg.bars} bars, ${seg.beats} beats/bar`;
            } else {
                const arrow = seg.start < seg.end ? '↑' : '↓';
                text = `${idx + 1}. ${seg.start}${arrow}${seg.end} BPM (Δ${seg.increment}), ${seg.bars} bars, ${seg.beats} beats/bar`;
            }
            
            div.textContent = text;
            display.appendChild(div);
        });
    }
}

// Initialize the metronome when page loads
window.addEventListener('DOMContentLoaded', () => {
    new DynamicMetronome();
});
