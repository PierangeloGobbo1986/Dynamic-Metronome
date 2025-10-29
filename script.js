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
            
            const sensitivity = canvasId === 'beatsKnob' ? 0.3 : 
                              canvasId === 'incrementKnob' ? 0.5 : 0.2;
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
            
            if (distance <= 12) {
                const beatNum = i + 1;
                if (this.accentBeats.has(beatNum)) {
                    this.accentBeats.delete(beatNum);
                } else {
                    this.accentBeats.add(beatNum);
                }
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
    
    start() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
