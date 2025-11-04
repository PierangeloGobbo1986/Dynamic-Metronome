#!/usr/bin/env python3
"""
TempoRamp - Progressive Tempo Metronome
Redesigned with Normal/Ramp modes and inline segment management
"""

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import pygame
import time
import numpy as np
import threading
from PIL import Image, ImageDraw, ImageFont, ImageTk
import math


class Knob(tk.Canvas):
    """A rotary knob widget with clickable center for direct value entry"""
    def __init__(self, parent, size=80, from_=0, to=100, value=50, label="", 
                 command=None, resolution=1, **kwargs):
        super().__init__(parent, width=size, height=size+30, 
                        bg='#E8A317', highlightthickness=0, **kwargs)
        
        self.size = size
        self.from_ = from_
        self.to = to
        self.value = value
        self.label = label
        self.command = command
        self.resolution = resolution
        self.radius = size // 2 - 10
        self.center = size // 2
        
        # Angle range: -135° to +135° (270° total)
        self.min_angle = -135
        self.max_angle = 135
        
        self.dragging = False
        self.last_y = 0
        
        self.draw_knob()
        self.draw_label()
        
        # Bind mouse events
        self.bind("<Button-1>", self.on_press)
        self.bind("<B1-Motion>", self.on_drag)
        self.bind("<ButtonRelease-1>", self.on_release)
    
    def draw_knob(self):
        """Draw the knob"""
        self.delete("knob")
        
        # Outer shadow
        self.create_oval(5, 5, self.size-5, self.size-5, 
                        fill='#1C1C1C', outline='#1C1C1C', tags="knob")
        
        # Main knob body (black)
        self.create_oval(8, 8, self.size-8, self.size-8,
                        fill='#2C2C2C', outline='#1C1C1C', width=2, tags="knob")
        
        # Inner circle (metallic look)
        inner_size = self.size * 0.6
        offset = (self.size - inner_size) / 2
        gradient_center = self.create_oval(offset, offset, 
                                          self.size-offset, self.size-offset,
                                          fill='#8C8C8C', outline='#6C6C6C', 
                                          width=2, tags="knob")
        
        # Calculate pointer angle
        value_range = self.to - self.from_
        normalized = (self.value - self.from_) / value_range
        angle = self.min_angle + normalized * (self.max_angle - self.min_angle)
        
        # Draw pointer line
        angle_rad = math.radians(angle)
        start_r = self.radius * 0.3
        end_r = self.radius * 0.85
        
        x1 = self.center + start_r * math.sin(angle_rad)
        y1 = self.center - start_r * math.cos(angle_rad)
        x2 = self.center + end_r * math.sin(angle_rad)
        y2 = self.center - end_r * math.cos(angle_rad)
        
        self.create_line(x1, y1, x2, y2, fill='#FFFFFF', width=3, tags="knob")
        
        # Value display in center - clickable
        self.value_text = self.create_text(self.center, self.center, 
                        text=str(int(self.value)),
                        font=('Helvetica', 10, 'bold'),
                        fill='#FFFFFF', tags=("knob", "clickable"))
    
    def draw_label(self):
        """Draw the label below the knob"""
        self.create_text(self.center, self.size + 15,
                        text=self.label,
                        font=('Helvetica', 9, 'bold'),
                        fill='#000000')
    
    def on_press(self, event):
        """Handle mouse press"""
        # Check if clicking on center value
        if self.size//2 - 15 < event.x < self.size//2 + 15 and \
           self.size//2 - 15 < event.y < self.size//2 + 15:
            self.prompt_value_entry()
        else:
            self.dragging = True
            self.last_y = event.y
    
    def prompt_value_entry(self):
        """Prompt user to enter value directly"""
        new_value = simpledialog.askinteger(
            "Set Value",
            f"Enter value ({self.from_}-{self.to}):",
            initialvalue=int(self.value),
            minvalue=self.from_,
            maxvalue=self.to
        )
        if new_value is not None:
            self.set(new_value)
            if self.command:
                self.command(self.value)
    
    def on_drag(self, event):
        """Handle mouse drag"""
        if self.dragging:
            dy = self.last_y - event.y
            value_range = self.to - self.from_
            change = (dy / 100) * value_range * 0.5
            
            new_value = self.value + change
            new_value = max(self.from_, min(self.to, new_value))
            new_value = round(new_value / self.resolution) * self.resolution
            
            if new_value != self.value:
                self.value = new_value
                self.draw_knob()
                if self.command:
                    self.command(self.value)
            
            self.last_y = event.y
    
    def on_release(self, event):
        """Handle mouse release"""
        self.dragging = False
    
    def get(self):
        """Get current value"""
        return self.value
    
    def set(self, value):
        """Set value"""
        self.value = max(self.from_, min(self.to, value))
        self.draw_knob()


class TempoRampGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("TempoRamp")
        
        # Create main canvas
        self.main_canvas = tk.Canvas(root, width=600, height=820, 
                                     bg='#E8A317', highlightthickness=0)
        self.main_canvas.pack()
        
        self.create_pedal_background()
        
        # Metronome state
        self.is_running = False
        self.current_thread = None
        self.accent_beats = {2, 4}
        self.tempo_segments = []
        
        # Mode tracking
        self.end_bpm_manually_set = False
        
        # GUI update throttling to prevent congestion
        self.last_gui_update = 0
        self.gui_update_pending = False
        
        # Initialize pygame
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            self.audio_available = True
            self.accent_sound = self._generate_click(frequency=1000, duration=0.05)
            self.normal_sound = self._generate_click(frequency=800, duration=0.05)
        except:
            self.audio_available = False
        
        self.create_gui()
    
    def _generate_click(self, frequency=1000, duration=0.05, sample_rate=44100):
        """Generate a click sound"""
        num_samples = int(sample_rate * duration)
        t = np.linspace(0, duration, num_samples, False)
        wave = np.sin(frequency * 2 * np.pi * t)
        envelope = np.exp(-10 * t / duration)
        wave = wave * envelope
        wave = (wave * 32767).astype(np.int16)
        stereo_wave = np.column_stack((wave, wave))
        return pygame.sndarray.make_sound(stereo_wave)
    
    def create_pedal_background(self):
        """Create pedal background"""
        for y in range(820):
            brightness = 232 + int((y / 820) * -30)
            color = f'#{brightness:02x}{max(brightness-69, 0):02x}17'
            self.main_canvas.create_line(0, y, 600, y, fill=color)
        
        screw_positions = [(30, 30), (570, 30), (30, 790), (570, 790)]
        for x, y in screw_positions:
            self.draw_screw(x, y)
    
    def draw_screw(self, x, y):
        """Draw a screw"""
        self.main_canvas.create_oval(x-6, y-6, x+6, y+6, 
                                     fill='#4C4C4C', outline='#2C2C2C', width=1)
        self.main_canvas.create_line(x-4, y, x+4, y, fill='#1C1C1C', width=2)
    
    def create_gui(self):
        # Title
        self.main_canvas.create_text(300, 30, text="TempoRamp",
                                     font=('Helvetica', 26, 'bold'), fill='#000000')
        self.main_canvas.create_text(300, 55, text="PROGRESSIVE TEMPO TRAINER",
                                     font=('Helvetica', 8, 'bold'), fill='#000000')
        
        # Info button
        info_btn = tk.Button(self.main_canvas, text="ℹ", 
                           font=('Helvetica', 12, 'bold'),
                           bg='#CCCCCC', fg='#000000', width=2, height=1,
                           relief=tk.RAISED, bd=2, command=self.show_instructions)
        self.main_canvas.create_window(560, 75, window=info_btn)
        
        # Knobs section
        knobs_frame = tk.Frame(self.main_canvas, bg='#E8A317')
        self.main_canvas.create_window(300, 180, window=knobs_frame)
        
        # Row 1: Start BPM, End BPM, BPM Increment
        self.start_bpm_knob = Knob(knobs_frame, label="START BPM", 
                                   from_=20, to=300, value=60, resolution=5,
                                   command=self.on_start_bpm_change)
        self.start_bpm_knob.grid(row=0, column=0, padx=20, pady=10)
        
        self.end_bpm_knob = Knob(knobs_frame, label="END BPM",
                                from_=20, to=300, value=60, resolution=5,
                                command=self.on_end_bpm_change)
        self.end_bpm_knob.grid(row=0, column=1, padx=20, pady=10)
        
        self.increment_knob = Knob(knobs_frame, label="BPM INCREMENT",
                                  from_=0, to=50, value=0, resolution=1,
                                  command=self.on_increment_change)
        self.increment_knob.grid(row=0, column=2, padx=20, pady=10)
        
        # Row 2: Bars/Tempo, Beats/Bar, Tempo Segments button
        self.bars_knob = Knob(knobs_frame, label="BARS/TEMPO",
                             from_=1, to=50, value=12, resolution=1, size=60)
        self.bars_knob.grid(row=1, column=0, padx=20, pady=10)
        
        self.beats_knob = Knob(knobs_frame, label="BEATS/BAR",
                              from_=1, to=16, value=4, resolution=1, size=60,
                              command=self.update_beat_count)
        self.beats_knob.grid(row=1, column=1, padx=20, pady=10)
        
        segments_btn = tk.Button(knobs_frame, text="TEMPO\nSEGMENTS",
                                font=('Helvetica', 8, 'bold'),
                                bg='#CCCCCC', fg='#000000', width=10, height=2,
                                relief=tk.RAISED, bd=2, command=self.show_segments_dialog)
        segments_btn.grid(row=1, column=2, padx=20, pady=10)
        
        # Mode indicator - LARGER FONT
        self.mode_label = tk.Label(self.main_canvas, text="Mode: NORMAL",
                                  font=('Helvetica', 14, 'bold'),
                                  bg='#E8A317', fg='#000000')
        self.main_canvas.create_window(300, 290, window=self.mode_label)
        
        # Display section
        display_frame = tk.Frame(self.main_canvas, bg='#2C2C2C', relief=tk.RAISED, bd=3)
        self.main_canvas.create_window(300, 390, window=display_frame)
        
        display_inner = tk.Frame(display_frame, bg='#2C2C2C', padx=20, pady=15)
        display_inner.pack()
        
        self.bpm_label = tk.Label(display_inner, text="Ready",
                                 font=('Helvetica', 32, 'bold'),
                                 bg='#2C2C2C', fg='#00FF00', width=12)
        self.bpm_label.pack(pady=(0, 5))
        
        self.info_label = tk.Label(display_inner, text="Press START to begin",
                                  font=('Helvetica', 11),
                                  bg='#2C2C2C', fg='#CCCCCC')
        self.info_label.pack(pady=(0, 10))
        
        self.beat_canvas = tk.Canvas(display_inner, width=400, height=80,
                                    bg='#1C1C1C', highlightthickness=0)
        self.beat_canvas.pack()
        self.beat_canvas.bind("<Button-1>", self.on_canvas_click)
        
        accent_hint = tk.Label(display_inner, text="Click circles to set accent beats",
                             font=('Helvetica', 8, 'italic'),
                             bg='#2C2C2C', fg='#FFD700')
        accent_hint.pack(pady=(5, 0))
        
        self.update_beat_display()
        
        # Control buttons - SIMPLE BUTTONS
        control_frame = tk.Frame(self.main_canvas, bg='#E8A317')
        self.main_canvas.create_window(300, 545, window=control_frame)
        
        self.start_button = tk.Button(control_frame, text="▶ START",
                                      font=('Helvetica', 14, 'bold'),
                                      bg='#00AA00', fg='white', width=12, height=2,
                                      command=self.start_metronome)
        self.start_button.grid(row=0, column=0, padx=10)
        
        self.stop_button = tk.Button(control_frame, text="■ STOP",
                                     font=('Helvetica', 14, 'bold'),
                                     bg='#CC0000', fg='white', width=12, height=2,
                                     command=self.stop_metronome, state=tk.DISABLED)
        self.stop_button.grid(row=0, column=1, padx=10)
        
        # Segment controls
        segment_control_frame = tk.Frame(self.main_canvas, bg='#E8A317')
        self.main_canvas.create_window(300, 625, window=segment_control_frame)
        
        save_seg_btn = tk.Button(segment_control_frame, text="Save Tempo Segment",
                                font=('Helvetica', 9, 'bold'),
                                bg='#4C9CFF', fg='#000000',
                                command=self.save_segment_inline)
        save_seg_btn.grid(row=0, column=0, padx=10)
        
        # Segment display box
        seg_box_frame = tk.Frame(segment_control_frame, bg='#1C1C1C', relief=tk.SUNKEN, bd=2)
        seg_box_frame.grid(row=0, column=1, padx=10)
        
        self.segment_display = tk.Text(seg_box_frame, height=3, width=30,
                                       font=('Courier', 8),
                                       bg='#1C1C1C', fg='#00FF00')
        self.segment_display.pack(padx=2, pady=2)
        self.update_segment_display()
        
        # Timer
        timer_frame = tk.Frame(self.main_canvas, bg='#000000', relief=tk.SUNKEN, bd=4)
        self.main_canvas.create_window(300, 715, window=timer_frame)
        
        self.timer_label = tk.Label(timer_frame, text="00:00",
                                    font=('Courier', 40, 'bold'),
                                    bg='#000000', fg='#FF0000',
                                    padx=40, pady=12)
        self.timer_label.pack()
        
        self.main_canvas.create_text(300, 780, text="TIME REMAINING",
                                     font=('Helvetica', 9, 'bold'),
                                     bg='#E8A317', fg='#000000')
        
        if not self.audio_available:
            self.main_canvas.create_text(300, 805, text="⚠ Visual mode only",
                                        font=('Helvetica', 9), fill='#CC0000')
    
    def on_start_bpm_change(self, value):
        """Handle start BPM knob change"""
        if not self.end_bpm_manually_set:
            # Mirror to end BPM
            self.end_bpm_knob.set(value)
        else:
            # Reset end BPM to match start BPM
            self.end_bpm_knob.set(value)
            self.end_bpm_manually_set = False
        self.update_mode()
    
    def on_end_bpm_change(self, value):
        """Handle end BPM knob change"""
        self.end_bpm_manually_set = True
        self.update_mode()
    
    def on_increment_change(self, value):
        """Handle increment change"""
        self.update_mode()
    
    def update_mode(self):
        """Update mode based on knob values"""
        start = int(self.start_bpm_knob.get())
        end = int(self.end_bpm_knob.get())
        
        if start == end or not self.end_bpm_manually_set:
            self.mode_label.config(text="Mode: NORMAL")
        else:
            self.mode_label.config(text="Mode: RAMP")
    
    def update_beat_count(self, value=None):
        """Update when beats per bar changes"""
        beats = int(self.beats_knob.get())
        self.accent_beats = {b for b in self.accent_beats if b <= beats}
        if not self.accent_beats and beats >= 2:
            self.accent_beats = {2}
            if beats >= 4:
                self.accent_beats.add(4)
        self.update_beat_display()
    
    def on_canvas_click(self, event):
        """Handle clicks on beat circles"""
        beats = int(self.beats_knob.get())
        canvas_width = 400
        dot_radius = 15
        spacing = min(60, (canvas_width - 40) / beats)
        start_x = (canvas_width - (spacing * (beats - 1))) / 2
        y = 40
        
        for i in range(beats):
            x = start_x + (i * spacing)
            distance = math.sqrt((event.x - x)**2 + (event.y - y)**2)
            
            if distance <= dot_radius:
                beat_num = i + 1
                if beat_num in self.accent_beats:
                    self.accent_beats.remove(beat_num)
                else:
                    self.accent_beats.add(beat_num)
                self.update_beat_display()
                break
    
    def update_beat_display(self, active_beat=None):
        """Update beat visualization"""
        self.beat_canvas.delete("all")
        beats = int(self.beats_knob.get())
        
        canvas_width = 400
        dot_radius = 15
        spacing = min(60, (canvas_width - 40) / beats)
        start_x = (canvas_width - (spacing * (beats - 1))) / 2
        y = 40
        
        for i in range(beats):
            x = start_x + (i * spacing)
            beat_num = i + 1
            is_accent = beat_num in self.accent_beats
            
            if active_beat is not None and i == active_beat:
                color = '#00FF00'
                outline = '#00AA00'
                outline_width = 3
            elif is_accent:
                color = '#4C4C4C'
                outline = '#FFD700'
                outline_width = 3
            else:
                color = '#3C3C3C'
                outline = '#666666'
                outline_width = 2
            
            self.beat_canvas.create_oval(x - dot_radius, y - dot_radius,
                                        x + dot_radius, y + dot_radius,
                                        fill=color, outline=outline, 
                                        width=outline_width)
            
            self.beat_canvas.create_text(x, y + 30, text=str(beat_num),
                                        font=('Helvetica', 10, 'bold'),
                                        fill='#999999')
    
    def save_segment_inline(self):
        """Save current settings as a segment"""
        start = int(self.start_bpm_knob.get())
        end = int(self.end_bpm_knob.get())
        increment = int(self.increment_knob.get())
        bars = int(self.bars_knob.get())
        beats = int(self.beats_knob.get())
        
        self.tempo_segments.append({
            'start': start,
            'end': end,
            'increment': increment,
            'bars': bars,
            'beats': beats
        })
        
        self.update_segment_display()
        self.mode_label.config(text="Mode: RAMP")
    
    def update_segment_display(self):
        """Update segment display box"""
        self.segment_display.delete(1.0, tk.END)
        if not self.tempo_segments:
            self.segment_display.insert(tk.END, "No segments saved")
        else:
            for i, seg in enumerate(self.tempo_segments, 1):
                self.segment_display.insert(tk.END, 
                    f"{i}. {seg['start']}→{seg['end']} +{seg['increment']} {seg['bars']}bars {seg['beats']}/4\n")
    
    def show_segments_dialog(self):
        """Show dialog to manage segments"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Manage Tempo Segments")
        dialog.geometry("400x300")
        dialog.configure(bg='#E8A317')
        
        tk.Label(dialog, text="Saved Tempo Segments",
                font=('Helvetica', 14, 'bold'),
                bg='#E8A317').pack(pady=10)
        
        list_frame = tk.Frame(dialog, bg='#2C2C2C', relief=tk.SUNKEN, bd=2)
        list_frame.pack(padx=20, pady=10, fill=tk.BOTH, expand=True)
        
        segments_text = tk.Text(list_frame, height=10, width=45,
                               font=('Courier', 10),
                               bg='#1C1C1C', fg='#00FF00')
        segments_text.pack(padx=5, pady=5)
        
        if not self.tempo_segments:
            segments_text.insert(tk.END, "No segments saved yet.\n\nUse knobs to set parameters,\nthen click 'Save Tempo Segment'.")
        else:
            for i, seg in enumerate(self.tempo_segments, 1):
                segments_text.insert(tk.END,
                    f"Segment {i}:\n")
                segments_text.insert(tk.END,
                    f"  {seg['start']} → {seg['end']} BPM (+{seg['increment']})\n")
                segments_text.insert(tk.END,
                    f"  {seg['bars']} bars, {seg['beats']}/4 time\n\n")
        
        btn_frame = tk.Frame(dialog, bg='#E8A317')
        btn_frame.pack(pady=10)
        
        tk.Button(btn_frame, text="Clear All Segments",
                 command=lambda: [self.clear_all_segments(), dialog.destroy()],
                 bg='#FF6666', fg='#000000', font=('Helvetica', 10, 'bold'),
                 width=18).pack(side=tk.LEFT, padx=5)
        
        tk.Button(btn_frame, text="Close",
                 command=dialog.destroy,
                 bg='#AAAAAA', fg='#000000', font=('Helvetica', 10, 'bold'),
                 width=18).pack(side=tk.LEFT, padx=5)
    
    def clear_all_segments(self):
        """Clear all saved segments"""
        self.tempo_segments = []
        self.update_segment_display()
        self.update_mode()
    
    def show_instructions(self):
        """Show instructions"""
        instructions = """TempoRamp - Progressive Tempo Trainer

NORMAL MODE:
Start BPM = End BPM, plays continuously until stopped.
Bars/Tempo is ignored. Accents can be changed during play.

RAMP MODE:
Start BPM ≠ End BPM, set BPM Increment, plays for set bars.

SEGMENTS MODE:
Save multiple tempo segments to play in sequence.

Click knob center numbers to type values directly.

ACCENT BEATS:
Click circles to toggle accents (gold outline)."""
        messagebox.showinfo("Instructions", instructions)
    
    def calculate_total_time(self):
        """Calculate total session time"""
        if self.tempo_segments:
            total_seconds = 0
            for seg in self.tempo_segments:
                beats_per_bar = seg['beats']
                bars = seg['bars']
                total_beats = beats_per_bar * bars
                
                current_bpm = seg['start']
                end_bpm = seg['end']
                increment = seg['increment']
                
                if increment == 0:
                    increment = 1
                
                while current_bpm <= end_bpm:
                    time_at_tempo = total_beats / (current_bpm / 60.0)
                    total_seconds += time_at_tempo
                    current_bpm += increment
            return total_seconds
        else:
            # Normal or Ramp mode
            start = int(self.start_bpm_knob.get())
            end = int(self.end_bpm_knob.get())
            increment = int(self.increment_knob.get())
            
            if start == end:
                return float('inf')  # Continuous
            
            if increment == 0:
                return 0
            
            beats_per_bar = int(self.beats_knob.get())
            bars = int(self.bars_knob.get())
            total_beats = beats_per_bar * bars
            
            total_seconds = 0
            current_bpm = start
            while current_bpm <= end:
                time_at_tempo = total_beats / (current_bpm / 60.0)
                total_seconds += time_at_tempo
                current_bpm += increment
            
            return total_seconds
    
    def format_time(self, seconds):
        """Format seconds as MM:SS"""
        if seconds == float('inf'):
            return "∞"
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes:02d}:{secs:02d}"
    
    def update_timer_display(self, remaining_seconds):
        """Update countdown timer"""
        self.root.after(0, lambda: 
                       self.timer_label.config(text=self.format_time(remaining_seconds)))
    
    def throttled_gui_update(self, update_func):
        """Throttle GUI updates to prevent event queue congestion"""
        current_time = time.time()
        # Only allow GUI updates every 0.1 seconds (10 times per second max)
        if current_time - self.last_gui_update >= 0.1 and not self.gui_update_pending:
            self.gui_update_pending = True
            self.last_gui_update = current_time
            try:
                self.root.after(0, self._execute_gui_update, update_func)
            except:
                self.gui_update_pending = False
    
    def _execute_gui_update(self, update_func):
        """Execute GUI update and reset pending flag"""
        try:
            update_func()
        finally:
            self.gui_update_pending = False
    
    def start_metronome(self):
        """Start the metronome"""
        if self.is_running:
            return
        
        start = int(self.start_bpm_knob.get())
        end = int(self.end_bpm_knob.get())
        increment = int(self.increment_knob.get())
        
        # Validation for ramp mode
        if start != end and increment == 0 and not self.tempo_segments:
            messagebox.showwarning("BPM Increment Required",
                                  "Start and End BPM parameters are different.\nPlease set a BPM increment!")
            return
        
        total_time = self.calculate_total_time()
        self.total_time = total_time
        self.session_start_time = time.perf_counter()  # Use perf_counter for precision
        self.update_timer_display(total_time)
        
        self.is_running = True
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        
        self.root.update_idletasks()
        
        self.current_thread = threading.Thread(target=self.run_metronome, daemon=True)
        self.current_thread.start()
    
    def stop_metronome(self):
        """Stop the metronome"""
        self.is_running = False
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.root.update_idletasks()
        self.root.after(100, self.reset_display)
    
    def reset_display(self):
        """Reset display"""
        self.bpm_label.config(text="Ready")
        self.info_label.config(text="Press START to begin")
        self.timer_label.config(text="00:00")
        self.update_beat_display()
    
    def run_metronome(self):
        """Run metronome with precise timing"""
        start = int(self.start_bpm_knob.get())
        end = int(self.end_bpm_knob.get())
        
        if self.tempo_segments:
            # Play segments
            for seg in self.tempo_segments:
                if not self.is_running:
                    break
                self.play_tempo_segment(seg)
        elif start == end:
            # Normal mode - continuous
            self.play_continuous(start)
        else:
            # Ramp mode
            segment = {
                'start': start,
                'end': end,
                'increment': int(self.increment_knob.get()),
                'bars': int(self.bars_knob.get()),
                'beats': int(self.beats_knob.get())
            }
            self.play_tempo_segment(segment)
        
        if self.is_running:
            self.root.after(0, self.metronome_complete)
    
    def play_continuous(self, bpm):
        """Play continuously at one BPM - optimized for long sessions"""
        beats_per_bar = int(self.beats_knob.get())
        beat_interval = 60.0 / bpm
        
        # Update BPM display once
        try:
            self.root.after_idle(lambda: self.bpm_label.config(text=f"{bpm} BPM"))
        except:
            pass
        
        beat_num = 0
        tempo_start = time.perf_counter()  # High precision timer
        
        while self.is_running:
            # Calculate exact target time for THIS beat
            target_time = tempo_start + (beat_num * beat_interval)
            
            beat_in_bar = (beat_num % beats_per_bar)
            bar_num = beat_num // beats_per_bar + 1
            
            # CRITICAL: Play audio IMMEDIATELY - never wait for GUI
            if self.audio_available:
                if (beat_in_bar + 1) in self.accent_beats:
                    self.accent_sound.play()
                else:
                    self.normal_sound.play()
            
            # Update beat circles - synced with audio but non-blocking
            try:
                self.root.after_idle(lambda beat=beat_in_bar:
                                    self.update_beat_display(beat))
            except:
                pass
            
            # Update bar counter occasionally (every 2 bars) to reduce load
            if beat_num % (beats_per_bar * 2) == 0:
                try:
                    self.root.after_idle(lambda b=bar_num:
                                        self.info_label.config(text=f"Bar {b}"))
                except:
                    pass
            
            # Sleep until exact target time for NEXT beat
            beat_num += 1
            next_target = tempo_start + (beat_num * beat_interval)
            current_time = time.perf_counter()
            sleep_time = next_target - current_time
            
            if sleep_time > 0.001:  # Only sleep if >1ms needed
                time.sleep(sleep_time)
            # If we're behind, continue immediately
    
    def play_tempo_segment(self, segment):
        """Play a tempo segment - optimized for long sessions"""
        current_bpm = segment['start']
        end_bpm = segment['end']
        increment = segment['increment']
        bars_per_tempo = segment['bars']
        beats_per_bar = segment['beats']
        
        if increment == 0:
            increment = 1
        
        while current_bpm <= end_bpm and self.is_running:
            # Update BPM display once per tempo
            try:
                self.root.after_idle(lambda bpm=current_bpm:
                                    self.bpm_label.config(text=f"{bpm} BPM"))
            except:
                pass
            
            beat_interval = 60.0 / current_bpm
            total_beats = bars_per_tempo * beats_per_bar
            
            tempo_start_time = time.perf_counter()  # High precision
            
            for beat_num in range(total_beats):
                if not self.is_running:
                    break
                
                # Calculate exact target time for THIS beat
                target_time = tempo_start_time + (beat_num * beat_interval)
                
                bar_num = beat_num // beats_per_bar + 1
                beat_in_bar = beat_num % beats_per_bar
                
                # CRITICAL: Play audio IMMEDIATELY - never wait for GUI
                if self.audio_available:
                    if (beat_in_bar + 1) in self.accent_beats:
                        self.accent_sound.play()
                    else:
                        self.normal_sound.play()
                
                # Update beat circles - synced with audio but non-blocking
                try:
                    self.root.after_idle(lambda beat=beat_in_bar:
                                        self.update_beat_display(beat))
                except:
                    pass
                
                # Update bar info only on first beat of bar
                if beat_num % beats_per_bar == 0:
                    try:
                        self.root.after_idle(lambda b=bar_num:
                                            self.info_label.config(text=f"Bar {b}/{bars_per_tempo}"))
                    except:
                        pass
                
                # Update timer occasionally (every 8 beats)
                if beat_num % 8 == 0 and hasattr(self, 'session_start_time'):
                    try:
                        elapsed = time.perf_counter() - self.session_start_time
                        if self.total_time != float('inf'):
                            remaining = max(0, self.total_time - elapsed)
                            self.root.after_idle(lambda r=remaining: 
                                               self.timer_label.config(text=self.format_time(r)))
                    except:
                        pass
                
                # Sleep until exact target time for NEXT beat
                next_beat_num = beat_num + 1
                next_target = tempo_start_time + (next_beat_num * beat_interval)
                current_time = time.perf_counter()
                sleep_time = next_target - current_time
                
                if sleep_time > 0.001:  # Only sleep if >1ms needed
                    time.sleep(sleep_time)
                # If behind, continue immediately
            
            current_bpm += increment
    
    def metronome_complete(self):
        """Called when complete"""
        self.is_running = False
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.bpm_label.config(text="Complete!")
        self.info_label.config(text="Session finished")
        self.timer_label.config(text="00:00")
        self.update_beat_display()


def main():
    root = tk.Tk()
    app = TempoRampGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
