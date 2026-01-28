# Voice Studio Update (Jan 27, 2026)

## Overview

The Voice Studio has been upgraded with a comprehensive **Audio Editor**, allowing users to trim recordings, reduce noise, and normalize volume before saving. This completes the "Phase 6" requirements for the studio.

## Key Features

### 1. Audio Editor

- **Waveform Visualization**: Interactive canvas showing audio amplitude.
- **Trimming**: Select regions and cut/remove them.
- **Undo/Redo**: Full history support for edits.
- **Playback**: Integrated player with speed controls (0.5x - 2.0x).

### 2. Audio Enhancements

- **Volume Normalization**: Automatically adjusts peak volume to standard levels (-1dB).
- **Noise Reduction**: Simple noise gate implementation to remove background hiss in silent periods.

### 3. Keyboard Shortcuts

For power users, the following shortcuts are available in the editor:

- **`Space`**: Toggle Play/Pause
- **`Delete` / `Backspace` / `X`**: Cut selected region
- **`Ctrl+Z`**: Undo last edit
- **`Escape`**: Cancel edit logic (if applicable)

## Technical Implementation

### Architecture

- `RecordingStudio.jsx`: Main container. Manages `recordingState` and data persistence.
- `AudioEditor.jsx`: The editor view. Handles `AudioContext`, `AudioBuffer` manipulation, and edit history (`edits` array).
- `WaveformVisualizer.jsx`: Renders the canvas. Handles mouse events for selection (`mousedown`, `mousemove`, `mouseup`).

### Data Flow

1. **Recording**: `MediaRecorder` produces `audio/webm` blobs.
2. **Storage**: Converted to Base64 for `voiceStore` (localStorage).
3. **Editing**:
   - Base64 is converted back to `Blob` -> `ArrayBuffer` -> `AudioBuffer`.
   - Edits (cuts) are applied mathematically to the `Float32Array` channels.
4. **Saving**:
   - `AudioBuffer` is re-encoded to WAV via `audioBufferToWav`.
   - WAV Blob is converted to Base64.
   - Store is updated with new data.

## Usage

1. Record audio or open an existing recording.
2. Click the **Edit Audio** button (Scissors icon).
3. Drag on the waveform to select a region.
4. Press `Delete` or click "Cut Selection".
5. Use "Enhance" menu to applying Normalization.
6. Click **Save & Replace** to commit changes.
