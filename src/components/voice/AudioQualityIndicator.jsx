/**
 * AudioQualityIndicator Component
 * Real-time audio level meter with clipping detection
 * Shows input volume levels and warns when audio is too loud
 */

import { useEffect, useRef, useState } from 'react';
import './AudioQualityIndicator.css';

export default function AudioQualityIndicator({ stream, isRecording }) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const clippingTimeoutRef = useRef(null);
  
  // Clipping detection state
  const [isClipping, setIsClipping] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    if (!stream || !isRecording) {
      stopAnalysis();
      return;
    }

    startAnalysis(stream);

    return () => {
      stopAnalysis();
    };
  }, [stream, isRecording]);

  function startAnalysis(mediaStream) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
      sourceRef.current.connect(analyserRef.current);
      
      drawMeter();
    } catch (error) {
      console.error('Error starting audio analysis:', error);
    }
  }

  function stopAnalysis() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (clippingTimeoutRef.current) {
      clearTimeout(clippingTimeoutRef.current);
      clippingTimeoutRef.current = null;
    }
  }

  function drawMeter() {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);

    // Calculate average level (0-1)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const level = average / 255; // Normalize to 0-1
    
    setCurrentLevel(level);

    // Check for clipping (level > 0.9)
    if (level > 0.9) {
      setIsClipping(true);
      
      // Reset clipping warning after 2 seconds
      if (clippingTimeoutRef.current) {
        clearTimeout(clippingTimeoutRef.current);
      }
      clippingTimeoutRef.current = setTimeout(() => {
        setIsClipping(false);
      }, 2000);
    }

    // Draw meter
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw segments (20 segments)
    const segmentCount = 20;
    const segmentHeight = height / segmentCount;
    const segmentsToLight = Math.floor(level * segmentCount);

    for (let i = 0; i < segmentCount; i++) {
      const y = height - (i + 1) * segmentHeight;
      const isLit = i < segmentsToLight;

      // Color based on level
      let color;
      if (i >= segmentCount * 0.8) {
        // Red zone (top 20%)
        color = isLit ? '#ef4444' : '#1a1a2e';
      } else if (i >= segmentCount * 0.6) {
        // Yellow zone (60-80%)
        color = isLit ? '#f59e0b' : '#1a1a2e';
      } else {
        // Green zone (bottom 60%)
        color = isLit ? '#10b981' : '#1a1a2e';
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, y, width, segmentHeight - 1);

      // Add glow effect for lit segments
      if (isLit) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(0, y, width, segmentHeight - 1);
        ctx.shadowBlur = 0;
      }
    }

    // Draw level text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const percentage = Math.round(level * 100);
    ctx.fillText(`${percentage}%`, width / 2, height / 2);

    animationRef.current = requestAnimationFrame(drawMeter);
  }

  function getLevelColor() {
    if (isClipping) return 'clipping';
    if (currentLevel > 0.9) return 'high';
    if (currentLevel > 0.7) return 'medium';
    return 'good';
  }

  return (
    <div className="audio-quality-indicator">
      <div className="quality-indicator-header">
        <span className="indicator-title">Audio Level</span>
        <span className={`indicator-status ${getLevelColor()}`}>
          {isClipping ? '⚠️ Clipping!' : '🎤 Good'}
        </span>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={40}
        height={200}
        className="quality-meter"
      />
      
      {isClipping && (
        <div className="clipping-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Audio is too loud! Move microphone away or reduce volume.
          </span>
        </div>
      )}
      
      <div className="quality-tips">
        <div className="tip">
          <span className="tip-icon">🎯</span>
          <span className="tip-text">Keep level between 60-80%</span>
        </div>
      </div>
    </div>
  );
}