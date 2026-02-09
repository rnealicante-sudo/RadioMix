import React, { useEffect, useRef } from 'react';

interface AnalogMeterProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
}

export const AnalogMeter: React.FC<AnalogMeterProps> = ({ analyser, width = 60, height = 45 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);
    
    let currentAngle = -45; 
    const targetDamping = 0.15; 

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      let rms = 0;
      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        rms = Math.sqrt(sum / dataArray.length);
      }

      const displayLevel = Math.min(rms * 5.5, 1.4); 
      const targetAngle = -45 + (displayLevel * 90); 
      
      const diff = targetAngle - currentAngle;
      currentAngle += diff * targetDamping;
      if (currentAngle < -45) currentAngle = -45;
      if (currentAngle > 45) currentAngle = 45;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.85;
      const radius = canvas.width * 0.75;

      // Background (Deep Blue/Black)
      ctx.fillStyle = '#0a1018'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Scale
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.6, Math.PI * 1.25, Math.PI * 1.75);
      ctx.strokeStyle = '#94a3b8'; // Slate-400
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Red Zone
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.6, Math.PI * 1.60, Math.PI * 1.75);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Needle
      const needleRad = (currentAngle - 90) * (Math.PI / 180);
      const nx = cx + Math.cos(needleRad) * (radius * 0.85);
      const ny = cy + Math.sin(needleRad) * (radius * 0.85);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = '#f97316'; // Orange Needle
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Pivot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();

      // Backlight Glow effect
      const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.1)'); // Sky blue glow
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0,0,canvas.width, canvas.height);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  return (
    <canvas ref={canvasRef} width={width} height={height} className="rounded-sm border border-slate-700" />
  );
};