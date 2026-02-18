
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

export const Recorder: React.FC<RecorderProps> = ({ state, onStart, onStop, onExport, onClear, onFormatChange, onScheduleChange, analyser }) => {
  const isAux2 = state.source === 'AUX2';
  const label = state.source === 'MASTER' ? 'MASTER' : state.source === 'AUX1' ? 'AUX 1' : 'AUX 2';
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 is Sunday
  
  const handleDayClick = (day: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      setSelectedDate(newDate);
  };

  const saveSchedule = () => {
      if (selectedDate && onScheduleChange) {
          const s = new Date(selectedDate);
          const [sh, sm] = startTime.split(':').map(Number);
          s.setHours(sh, sm);
          
          const e = new Date(selectedDate);
          const [eh, em] = endTime.split(':').map(Number);
          e.setHours(eh, em);
          
          onScheduleChange(s.toISOString(), e.toISOString());
          setShowCalendar(false);
      }
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(viewDate);
    const startDay = firstDayOfMonth(viewDate);
    const days = [];
    
    // Empty cells
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="w-5 h-5"></div>);
    
    // Days
    for (let d = 1; d <= totalDays; d++) {
        const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === viewDate.getMonth();
        days.push(
            <button 
                key={d} 
                onClick={() => handleDayClick(d)}
                className={`w-6 h-6 flex items-center justify-center text-[9px] rounded-sm transition-colors ${isSelected ? 'bg-amber-600 text-white font-bold' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                {d}
            </button>
        );
    }

    return (
        <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 z-50 bg-[#0a121d] border border-amber-900/50 rounded shadow-2xl p-2 w-[200px]">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-[10px] font-bold text-amber-500 uppercase">Schedule Rec</span>
                <button onClick={() => setShowCalendar(false)}><X size={10} className="text-slate-500 hover:text-white" /></button>
            </div>

            {/* Month Nav */}
            <div className="flex justify-between items-center mb-2 px-1">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}><ChevronLeft size={10} /></button>
                <span className="text-[9px] font-black text-slate-300 uppercase">
                    {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}><ChevronRight size={10} /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-[7px] text-center text-slate-500 font-bold">{d}</div>)}
                {days}
            </div>

            {/* Time Inputs */}
            {selectedDate && (
                <div className="flex flex-col gap-1 bg-[#050910] p-1 rounded mb-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] text-slate-400">Start:</span>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-transparent text-[9px] text-amber-400 outline-none w-[45px]" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] text-slate-400">End:</span>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-transparent text-[9px] text-amber-400 outline-none w-[45px]" />
                    </div>
                </div>
            )}

            {/* Actions */}
            <button 
                onClick={saveSchedule}
                disabled={!selectedDate}
                className="w-full bg-amber-700 hover:bg-amber-600 text-white text-[9px] font-bold py-1 rounded flex items-center justify-center gap-1 disabled:opacity-50"
            >
                <Check size={10} /> Confirm
            </button>
        </div>
    );
  };

  return (
    <div className={`relative bg-[#0d1a29] border ${state.isRecording ? 'border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : isAux2 ? 'border-amber-900/30' : 'border-slate-800/40'} rounded p-1.5 flex flex-col gap-1 w-full transition-all group`}>
      
      {showCalendar && renderCalendar()}

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

      {/* Signal Meter */}
      <div className="w-full h-[10px] bg-black/50 rounded-[1px] overflow-hidden mt-0.5 mb-1 opacity-90 border border-slate-900/50">
         <MiniVisualizer analyser={analyser} width={100} height={10} segmentCount={20} orientation="horizontal" />
      </div>

      {/* Scheduler Toggle (AUX 2 Only) */}
      {isAux2 && onScheduleChange && (
          <div className="flex items-center justify-between bg-black/30 border border-amber-900/20 rounded px-1 py-0.5 mb-1">
             <div className="flex items-center gap-1">
                 <Calendar size={9} className="text-amber-700" />
                 <span className="text-[7px] text-amber-600 font-bold uppercase">
                     {state.scheduledStart ? new Date(state.scheduledStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'OFF'}
                 </span>
             </div>
             <button onClick={() => setShowCalendar(true)} className="text-[7px] bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 px-1 rounded border border-amber-900/30">
                 SET
             </button>
          </div>
      )}

      {/* Main Buttons */}
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
