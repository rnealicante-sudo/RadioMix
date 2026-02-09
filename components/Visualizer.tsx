
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 2048; 
    const dataArray = new Uint8Array(bufferLength);
    
    let currentLevel = 0;
    let peakLevel = 0;
    let peakHoldFrames = 0;
    const PEAK_HOLD_TIME = 60;

    const render = () => {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo oscuro de rack
      ctx.fillStyle = '#050910';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Textura de rejilla
      ctx.fillStyle = '#0a101d';
      for(let i=0; i<canvas.width; i+=8) {
          ctx.fillRect(i, 0, 1, canvas.height);
      }

      let rms = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        rms = Math.sqrt(sum / bufferLength);
      }

      const sensitivity = 5.0; 
      const targetLevel = Math.min(rms * sensitivity, 1.0);
      
      if (targetLevel > currentLevel) {
          currentLevel = targetLevel;
      } else {
          currentLevel += (targetLevel - currentLevel) * 0.12;
      }

      if (currentLevel > peakLevel) {
          peakLevel = currentLevel;
          peakHoldFrames = PEAK_HOLD_TIME;
      } else {
          if (peakHoldFrames > 0) {
              peakHoldFrames--;
          } else {
              peakLevel -= 0.006;
          }
      }

      const paddingX = 20; 
      const paddingY = 12;
      const totalBarHeight = canvas.height - (paddingY * 2);
      const singleBarHeight = (totalBarHeight / 2) - 4; 
      
      const numSegments = 70;
      const usableWidth = canvas.width - (paddingX * 2);
      const segmentWidth = usableWidth / numSegments;
      const gap = 2;

      const drawLEDStrip = (y: number, label: string) => {
          // Label de canal
          ctx.fillStyle = '#334155';
          ctx.font = 'black 9px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(label, paddingX - 6, y + singleBarHeight/1.5);

          // Fondo de segmentos apagados
          ctx.fillStyle = '#0f172a';
          for(let i = 0; i < numSegments; i++) {
               const x = paddingX + (i * segmentWidth);
               ctx.fillRect(x, y, segmentWidth - gap, singleBarHeight);
          }

          // Segmentos activos
          const activeSegments = Math.floor(currentLevel * numSegments);
          for (let i = 0; i < activeSegments; i++) {
              const x = paddingX + (i * segmentWidth);
              const percent = i / numSegments;
              
              if (percent > 0.88) {
                   ctx.fillStyle = '#ef4444'; // Red (Clip)
                   ctx.shadowColor = '#ef4444';
              } else if (percent > 0.65) {
                   ctx.fillStyle = '#fbbf24'; // Amber (Warn)
                   ctx.shadowColor = '#fbbf24';
              } else {
                   ctx.fillStyle = '#10b981'; // Green (Normal)
                   ctx.shadowColor = '#10b981';
              }
              
              ctx.shadowBlur = 6;
              ctx.fillRect(x, y, segmentWidth - gap, singleBarHeight);
              ctx.shadowBlur = 0;
          }

          // Pico (Peak)
          const peakIdx = Math.floor(peakLevel * numSegments);
          if (peakIdx < numSegments && peakLevel > 0.02) {
              const x = paddingX + (peakIdx * segmentWidth);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, y, segmentWidth - gap, singleBarHeight);
          }
      };

      drawLEDStrip(paddingY, "L");
      drawLEDStrip(paddingY + singleBarHeight + 8, "R");

      // Escala de dB
      const dbPoints = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      const dbLabels = ["-∞", "-40", "-20", "-10", "-3", "0dB"];
      
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.font = '8px monospace';
      
      dbPoints.forEach((pt, idx) => {
          const x = paddingX + (pt * usableWidth);
          ctx.fillText(dbLabels[idx], x, canvas.height - 2);
      });
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  return (
    <div className="w-full h-full flex flex-col justify-center overflow-hidden">
        <canvas ref={canvasRef} width={1000} height={75} className="w-full h-full" />
    </div>
  );
};
