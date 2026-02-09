
import React from 'react';
import { Circle, Square, Download, Trash2, CalendarDays } from 'lucide-react';
import { RecorderState, ExportFormat } from '../types';
import { MiniVisualizer } from './MiniVisualizer';

interface RecorderProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
  onExport: () => void;
  onClear: () => void;
  onFormatChange?: (format: ExportFormat) => void;
  onScheduleChange?: (start: string, end: string) => void;
  analyser?: AnalyserNode | null | undefined;
}

export const Recorder: React.FC<RecorderProps> = ({ state, onStart, onStop, onExport, onClear, onFormatChange, onScheduleChange, analyser }) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAux2 = state.source === 'AUX2';
  const label = state.source === 'MASTER' ? 'MASTER' : state.source === 'AUX1' ? 'AUX 1' : 'AUX 2';

  return (
    <div className={`bg-[#0d1a29] border ${state.isRecording ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : isAux2 ? 'border-amber-900/30' : 'border-slate-800/40'} rounded p-1.5 flex flex-col gap-1 w-full transition-all`}>
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800/50 pb-1">
        <div className="flex flex-col">
           <span className={`text-[8px] font-black tracking-widest uppercase ${state.isRecording ? 'text-red-500' : 'text-slate-500'}`}>
            {label}
           </span>
           <select 
              value={state.format} 
              onChange={(e) => onFormatChange?.(e.target.value as ExportFormat)}
              className="bg-black/40 text-[7px] font-black text-white/50 border-none rounded px-0.5 outline-none cursor-pointer"
           >
              <option value="MP3">MP3</option>
              <option value="WEBM">WEBM</option>
              <option value="WAV">WAV</option>
              <option value="OGG">OGG</option>
           </select>
        </div>
        <div className="bg-black/40 px-1 py-0.5 rounded border border-slate-800/50">
           <span className={`text-[10px] font-mono font-bold ${state.isRecording ? 'text-red-400 animate-pulse' : 'text-amber-500'}`}>
            {formatTime(state.time)}
           </span>
        </div>
      </div>

      {/* Signal Meter (Inside Recorder Unit - Bigger Height) */}
      <div className="w-full h-[10px] bg-black/50 rounded-[1px] overflow-hidden mt-0.5 mb-1 opacity-90 border border-slate-900/50">
         <MiniVisualizer analyser={analyser} width={100} height={10} segmentCount={20} orientation="horizontal" />
      </div>

      {/* Scheduler (Solo para Aux 2) */}
      {isAux2 && onScheduleChange && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-1 flex items-center justify-between gap-1 scale-[0.9] origin-left">
            <CalendarDays size={9} className="text-amber-700" />
            <div className="flex gap-1 items-center">
                <input 
                    type="time" 
                    value={state.scheduledStart || ''} 
                    onChange={(e) => onScheduleChange(e.target.value, state.scheduledEnd || '')}
                    className="bg-[#050910] text-[8px] text-amber-600 border border-slate-800 rounded outline-none w-[35px] px-0.5"
                />
                <input 
                    type="time" 
                    value={state.scheduledEnd || ''} 
                    onChange={(e) => onScheduleChange(state.scheduledStart || '', e.target.value)}
                    className="bg-[#050910] text-[8px] text-amber-600 border border-slate-800 rounded outline-none w-[35px] px-0.5"
                />
            </div>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex flex-col gap-1">
        {!state.isRecording ? (
          <button 
            onClick={onStart}
            className="w-full bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 rounded py-0.5 flex items-center justify-center gap-1 transition-all active:scale-95 group"
          >
            <Circle size={8} fill="currentColor" /> 
            <span className="text-[8px] font-black tracking-widest uppercase">REC</span>
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="w-full bg-red-600 border border-red-400 text-white rounded py-0.5 flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <Square size={8} fill="currentColor" /> 
            <span className="text-[8px] font-black tracking-widest uppercase">STOP</span>
          </button>
        )}

        <div className="flex gap-1">
          <button 
            onClick={onExport}
            disabled={state.chunks.length === 0 || state.isRecording}
            className="flex-1 bg-cyan-900/10 hover:bg-cyan-900/30 border border-cyan-900/30 text-cyan-500 rounded py-0.5 flex items-center justify-center gap-1 transition-all disabled:opacity-10"
          >
            <Download size={8} /> <span className="text-[7px] font-black uppercase">EXP</span>
          </button>
          <button 
            onClick={onClear}
            disabled={state.chunks.length === 0 || state.isRecording}
            className="w-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-600 hover:text-red-400 rounded py-0.5 flex items-center justify-center transition-all disabled:opacity-10"
          >
            <Trash2 size={8} />
          </button>
        </div>
      </div>
    </div>
  );
};
