
import React, { useState, useEffect } from 'react';
import { Radio, Wifi } from 'lucide-react';

interface StudioStatusProps {
  isOnAir: boolean;
}

export const StudioStatus: React.FC<StudioStatusProps> = ({ isOnAir }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="flex items-center gap-6 px-4 py-1 bg-[#0a121d] border border-slate-800 rounded-md shadow-inner">
      {/* ON AIR SIGN */}
      <div className="flex flex-col items-center">
        <div className={`px-3 py-0.5 rounded-sm border-2 text-[10px] font-black transition-all duration-500 tracking-tighter ${
          isOnAir 
            ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.8)]' 
            : 'bg-[#1a1a1a] border-slate-800 text-slate-700 shadow-none'
        }`}>
          ON AIR
        </div>
      </div>

      {/* STUDIO CLOCK */}
      <div className="flex flex-col items-center">
        <span className="text-[18px] font-mono font-bold text-cyan-400 leading-none tracking-widest" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
          {formatTime(time)}
        </span>
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Master Sync</span>
      </div>

      {/* SIGNAL INFO */}
      <div className="hidden lg:flex flex-col gap-1">
        <div className="flex items-center gap-2">
            <Wifi size={10} className="text-cyan-500" />
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-1 h-2 rounded-full ${i <= 4 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                ))}
            </div>
        </div>
        <span className="text-[8px] font-bold text-slate-600">64-BIT ENGINE</span>
      </div>
    </div>
  );
};
