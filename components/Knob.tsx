import React from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  colorClass?: string;
  sizeClass?: string;
}

export const Knob: React.FC<KnobProps> = ({ 
  value, min, max, onChange, label, colorClass, sizeClass = "w-7 h-7" 
}) => (
    <div className="flex flex-col items-center justify-center w-full">
        <div className={`relative ${sizeClass} bg-[#1e293b] rounded-full border border-slate-900 shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
            <input
                type="range"
                min={min} max={max} step="0.1"
                value={value}
                onChange={onChange}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                title={`${label}: ${value}dB`}
            />
            <div
                className="absolute top-0 left-0 w-full h-full rounded-full pointer-events-none flex items-center justify-center transition-transform duration-75"
                style={{ transform: `rotate(${((value - min) / (max - min)) * 270 - 135}deg)` }}
            >
                {/* Indicator Line */}
                <div className={`w-[2px] h-[40%] rounded-full absolute top-[10%] ${colorClass || 'bg-slate-200'}`}></div>
            </div>
            {/* Center Cap */}
            <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-[#334155] to-[#0f172a] pointer-events-none"></div>
        </div>
        <label className="text-[7px] font-bold text-slate-500 mt-1 uppercase">{label}</label>
    </div>
);