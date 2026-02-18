
import React, { useState } from 'react';
import { Circle, Square, Download, Trash2, Calendar, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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

export const Recorder: React.FC<RecorderProps> = ({ state, onStart, onStop, onExport, onClear, onFormatChange, analyser }) => {
  const label = state.source === 'MASTER' ? 'MASTER' : state.source === 'AUX1' ? 'AUX 1' : 'AUX 2';
  
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col bg-[#0d1a29] border ${state.isRecording ? 'border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.2)]' : 'border-slate-800/40'} rounded-sm p-1 gap-1 w-full h-full justify-between transition-all overflow-hidden`}>
      
      {/* Header Compact */}
      <div className="flex justify-between items-center border-b border-slate-800/50 pb-0.5">
        <span className={`text-[7px] font-black tracking-widest uppercase ${state.isRecording ? 'text-red-500' : 'text-slate-500'}`}>
          {label}
        </span>
        <span className={`text-[9px] font-mono font-bold ${state.isRecording ? 'text-red-400 animate-pulse' : 'text-amber-500'}`}>
          {formatTime(state.time)}
        </span>
      </div>

      {/* Signal Meter Slim */}
      <div className="w-full h-[6px] bg-black/50 rounded-[1px] overflow-hidden opacity-90 border border-slate-900/50">
         <MiniVisualizer analyser={analyser} width={100} height={6} segmentCount={15} orientation="horizontal" />
      </div>

      {/* Mini Controls */}
      <div className="flex gap-0.5">
        {!state.isRecording ? (
          <button 
            onClick={onStart}
            className="flex-1 bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 rounded-sm py-0.5 flex items-center justify-center gap-1 transition-all"
          >
            <Circle size={7} fill="currentColor" /> 
            <span className="text-[7px] font-black uppercase">REC</span>
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="flex-1 bg-red-600 border border-red-400 text-white rounded-sm py-0.5 flex items-center justify-center gap-1 transition-all"
          >
            <Square size={7} fill="currentColor" /> 
            <span className="text-[7px] font-black uppercase">STOP</span>
          </button>
        )}

        <button 
          onClick={onClear}
          disabled={state.chunks.length === 0 || state.isRecording}
          className="w-5 bg-slate-900 border border-slate-800 text-slate-600 rounded-sm py-0.5 flex items-center justify-center disabled:opacity-5"
        >
          <Trash2 size={7} />
        </button>
      </div>
    </div>
  );
};
