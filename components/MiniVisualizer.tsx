
import React, { useEffect, useRef } from 'react';

interface MiniVisualizerProps {
  analyser: AnalyserNode | null | undefined;
  width?: number;
  height?: number;
  segmentCount?: number;
  orientation?: 'vertical' | 'horizontal';
}

export const MiniVisualizer: React.FC<MiniVisualizerProps> = ({ 
    analyser, 
    width = 12, 
    height = 150,
    segmentCount: initialSegmentCount = 30,
    orientation = 'vertical'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHorizontal = orientation === 'horizontal';

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 32);

    let currentLevel = 0;
    let peakLevel = 0;
    let peakHoldFrames = 0;
    const PEAK_HOLD_TIME = 30; // Slightly faster peak release

    const segmentCount = isHorizontal ? initialSegmentCount : Math.max(10, Math.floor(height / 4));

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0a1018'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let rms = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) {
            const amplitude = (dataArray[i] - 128) / 128;
            sum += amplitude * amplitude;
        }
        rms = Math.sqrt(sum / dataArray.length);
      }

      // Boost sensitivity slightly
      const targetLevel = Math.min(rms * 5.2, 1.0);

      if (targetLevel > currentLevel) {
          currentLevel = targetLevel; // Instant attack
      } else {
          // Faster decay for snappier feel
          currentLevel += (targetLevel - currentLevel) * 0.3; 
      }

      if (currentLevel > peakLevel) {
          peakLevel = currentLevel;
          peakHoldFrames = PEAK_HOLD_TIME;
      } else {
          if (peakHoldFrames > 0) {
              peakHoldFrames--;
          } else {
              peakLevel -= 0.008; // Faster peak fall
          }
      }
      
      const segmentDim = isHorizontal 
        ? (canvas.width - segmentCount) / segmentCount 
        : (canvas.height - segmentCount) / segmentCount;
        
      const activeSegments = Math.floor(currentLevel * segmentCount);
      const peakSegmentIndex = Math.floor(peakLevel * segmentCount);

      for (let i = 0; i < segmentCount; i++) {
        const segmentIndex = isHorizontal ? i : segmentCount - 1 - i;
        const pos = i * (segmentDim + 1);
        
        let activeColor = '#4ade80'; 
        let inactiveColor = '#1e293b'; 
        
        if (segmentIndex > (segmentCount * 0.85)) {
            activeColor = '#ef4444'; 
        } else if (segmentIndex > (segmentCount * 0.65)) {
            activeColor = '#eab308'; 
        }

        const isActive = segmentIndex <= activeSegments;
        const isPeak = segmentIndex === peakSegmentIndex;

        if (isActive) {
            ctx.fillStyle = activeColor;
            if (isHorizontal) ctx.fillRect(pos, 1, segmentDim, canvas.height - 2);
            else ctx.fillRect(1, pos, canvas.width - 2, segmentDim);
        } else {
             ctx.fillStyle = inactiveColor;
             if (isHorizontal) ctx.fillRect(pos, 1, segmentDim, canvas.height - 2);
             else ctx.fillRect(1, pos, canvas.width - 2, segmentDim);
        }

        if (isPeak && peakLevel > 0.01) {
            ctx.fillStyle = '#ef4444'; 
            if (isHorizontal) ctx.fillRect(pos, 0, segmentDim, canvas.height);
            else ctx.fillRect(0, pos, canvas.width, segmentDim);
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, height, initialSegmentCount, isHorizontal]);

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="rounded-[1px]"
    />
  );
};
