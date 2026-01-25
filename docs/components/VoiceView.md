# VoiceView Component

## Overview

`VoiceView` is the interface for the **Voice Studio**, enabling users to record high-quality audio and transcribe it using Google Gemini AI.

## Features

- **Voice Gallery**: Displays historical voice notes in a responsive grid, filtered by the `voice-studio` tag.
- **Recording Studio**: A dedicated, focused recording interface with a real-time visualizer.
- **Audio Visualizer**: Real-time frequency analysis using HTML5 Canvas and Web Audio API.
- **Gemini Integration**: Sends recorded audio (Base64) to Google Gemini for transcription and summarization.
- **Smart Summary**: Automatically generates a structured note with verbatim transcript and AI-powered summary.
- **Navigation**: Integrated "View in Notes" links for quick access to the full note content.

## Usage

```jsx
import VoiceView from './components/VoiceView'

// Route integration
;<Route path="/voice" element={<VoiceView />} />
```

## Dependencies

- **Web Audio API**: For visualization.
- **MediaRecorder API**: For capturing audio.
- **@google/generative-ai**: For AI processing.

## State

- `isRecording`: Boolean, controls recorder and visualizer loop.
- `isProcessing`: Boolean, shows loading state during API call.
- `transcriptData`: null | { transcript, summary } - Result from API.
