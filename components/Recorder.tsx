
import React from 'react';
import { Circle, Square, Download, Trash2, ChevronDown } from 'lucide-react';
import { RecorderState, ExportFormat } from '../types';
import { MiniVisualizer } from './MiniVisualizer';

interface RecorderProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
  onExport: () => void;
  onClear: () => void;
  onFormatChange?: (format: ExportFormat) => void;
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
    <div className={`flex flex-col bg-[#0d1a29] border ${state.isRecording ? 'border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.2)]' : 'border-slate-800/40'} rounded-sm p-1.5 gap-1.5 w-full h-full justify-between transition-all overflow-hidden`}>
      
      {/* Header Compact */}
      <div className="flex justify-between items-center border-b border-slate-800/50 pb-1">
        <span className={`text-[8px] font-black tracking-widest uppercase ${state.isRecording ? 'text-red-500' : 'text-slate-500'}`}>
          {label}
        </span>
        <span className={`text-[10px] font-mono font-bold ${state.isRecording ? 'text-red-400 animate-pulse' : 'text-amber-500'}`}>
          {formatTime(state.time)}
        </span>
      </div>

      {/* Signal Meter Slim */}
      <div className="w-full h-[8px] bg-black/50 rounded-[1px] overflow-hidden opacity-90 border border-slate-900/50">
         <MiniVisualizer analyser={analyser} width={100} height={8} segmentCount={20} orientation="horizontal" />
      </div>

      {/* Format Selector */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex-1 relative group">
          <select 
            value={state.format}
            onChange={(e) => onFormatChange?.(e.target.value as ExportFormat)}
            disabled={state.isRecording}
            className="w-full bg-[#050910] border border-slate-800 rounded px-1 py-0.5 text-[7px] font-black text-slate-400 appearance-none focus:outline-none focus:border-cyan-500 disabled:opacity-30"
          >
            <option value="MP3">MP3</option>
            <option value="WEBM">WEBM</option>
            <option value="OGG">OGG</option>
          </select>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-cyan-500">
            <ChevronDown size={8} />
          </div>
        </div>
        <button 
          onClick={onExport}
          disabled={state.chunks.length === 0 || state.isRecording}
          className="w-6 h-4 bg-cyan-900/20 border border-cyan-800 text-cyan-500 rounded-sm flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-10"
          title="Export recording"
        >
          <Download size={9} />
        </button>
      </div>

      {/* Mini Controls */}
      <div className="flex gap-1">
        {!state.isRecording ? (
          <button 
            onClick={onStart}
            className="flex-1 h-6 bg-red-900/10 hover:bg-red-900/30 border border-red-900/30 text-red-500 rounded-sm flex items-center justify-center gap-1 transition-all"
          >
            <Circle size={8} fill="currentColor" /> 
            <span className="text-[8px] font-black uppercase">REC</span>
          </button>
        ) : (
          <button 
            onClick={onStop}
            className="flex-1 h-6 bg-red-600 border border-red-400 text-white rounded-sm flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)]"
          >
            <Square size={8} fill="currentColor" /> 
            <span className="text-[8px] font-black uppercase">STOP</span>
          </button>
        )}

        <button 
          onClick={onClear}
          disabled={state.chunks.length === 0 || state.isRecording}
          className="w-6 h-6 bg-slate-900 border border-slate-800 text-slate-600 rounded-sm flex items-center justify-center hover:text-red-400 disabled:opacity-5 transition-colors"
          title="Clear recording"
        >
          <Trash2 size={9} />
        </button>
      </div>
    </div>
  );
};
