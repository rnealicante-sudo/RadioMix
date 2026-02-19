
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ChevronDown } from 'lucide-react';
import { MiniVisualizer } from './MiniVisualizer';
import { DeckId } from '../types';
import { Knob } from './Knob';
import { RADIO_STATIONS_MAP } from '../hooks/useAudioMixer';

interface DeckProps {
  id: DeckId;
  onLoad: (file: File) => void;
  onTogglePlay: () => void;
  onStop?: () => void;
  onStreamChange?: (url: string) => void;
  onTrimChange: (value: number) => void;
  trim: number;
  onVolumeChange: (value: number) => void;
  onAuxLevelChange: (auxIdx: 1 | 2, value: number) => void;
  onEqChange: (band: 'L' | 'M' | 'H', value: number) => void;
  onToggleEq: () => void;
  audioElement: HTMLAudioElement | null | undefined;
  analyser: AnalyserNode | null | undefined;
  bitrate?: number;
}

export const Deck: React.FC<DeckProps> = ({ 
    id, onTogglePlay, onStop, onStreamChange, onTrimChange, trim,
    onVolumeChange, onAuxLevelChange, audioElement, analyser,
    bitrate
}) => {
  const isRne = id === 'MIC' || id === 'A' || id === 'RNE_EMISORAS';
  const isEsRadio = id === 'ES_RADIO';
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8); 
  const [isOn, setIsOn] = useState(true); 
  const [aux1On, setAux1On] = useState(false);
  const [aux2On, setAux2On] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  const faderContainerRef = useRef<HTMLDivElement>(null);
  const [faderHeight, setFaderHeight] = useState(150);

  const subStations = RADIO_STATIONS_MAP[id] || [];

  useEffect(() => {
    if (!audioElement) return;
    const update = () => setIsPlaying(!audioElement.paused);
    audioElement.addEventListener('play', update);
    audioElement.addEventListener('pause', update);
    return () => {
      audioElement.removeEventListener('play', update);
      audioElement.removeEventListener('pause', update);
    };
  }, [audioElement]);

  useEffect(() => { 
    if (audioElement && !currentUrl) setCurrentUrl(audioElement.src);
    onVolumeChange(isOn ? volume : 0); 
  }, [isOn, volume, audioElement]);

  useEffect(() => {
    if (!faderContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) setFaderHeight(entry.contentRect.height);
    });
    observer.observe(faderContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStationChange = (url: string) => {
    setCurrentUrl(url);
    if (onStreamChange) onStreamChange(url);
    setShowSelector(false);
  };

  const toggleAux = (idx: 1 | 2) => {
    if (idx === 1) {
      const newState = !aux1On; setAux1On(newState); onAuxLevelChange(1, newState ? 1.0 : 0.0);
    } else {
      const newState = !aux2On; setAux2On(newState); onAuxLevelChange(2, newState ? 1.0 : 0.0);
    }
  };

  const getSubLabel = () => {
      if (id === 'MIC') return 'R1 CV (RNE)';
      if (id === 'A') return 'RNE OCASIONAL';
      if (id === 'RNE_EMISORAS') return 'RNE CADENAS';
      if (id === 'F') return 'SER PROVINCIAL';
      if (id === 'ES_RADIO') return 'ES RADIO';
      return subStations[0]?.name || id;
  };

  const activeStationName = subStations.find(s => s.url === currentUrl)?.name || subStations[0]?.name || 'STREAM';

  return (
    <div className={`flex flex-col items-center border-r border-[#15283d] flex-1 min-w-[100px] h-full relative bg-[#1e3a57] transition-all overflow-hidden shadow-2xl`}>
      
      {/* CHANNEL HEADER */}
      <div className="w-full text-center py-2 bg-[#112233] border-b border-[#2d4b6b] shrink-0">
          <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">NET STREAM</div>
          <div className={`text-[9px] font-black tracking-tighter truncate px-1 uppercase ${isRne ? 'text-amber-500' : isEsRadio ? 'text-white' : 'text-cyan-400'}`}>
              {getSubLabel()}
          </div>
      </div>

      {/* SUB-STATION SELECTOR (IF MULTIPLE) */}
      <div className="w-full bg-[#0d1a25]/80 px-1 py-1 shrink-0 border-b border-slate-700/30">
        {subStations.length > 1 ? (
          <div className="relative">
            <button 
              onClick={() => setShowSelector(!showSelector)}
              className="w-full flex items-center justify-between bg-[#1b324a] border border-slate-600 rounded px-1.5 py-1 text-[8px] font-black text-slate-100 hover:bg-slate-700 transition-colors uppercase truncate"
            >
              <span className="truncate">{activeStationName}</span>
              <ChevronDown size={8} className="shrink-0 ml-1 text-cyan-500" />
            </button>
            {showSelector && (
              <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-[#0b111a] border border-slate-700 rounded shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                {subStations.map((station, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleStationChange(station.url)}
                    className={`w-full text-left px-2 py-1.5 text-[8px] font-bold uppercase transition-colors border-b border-slate-800/50 ${currentUrl === station.url ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    {station.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full text-center py-1 text-[7px] font-bold text-slate-600 uppercase tracking-widest truncate">
             Direct Signal
          </div>
        )}
      </div>

      {/* INPUT SELECTOR / PLAYBACK */}
      <div className="w-full px-1 py-2 shrink-0 bg-[#0d1a25]/30">
        <div className="flex gap-1">
            <button onClick={onStop} className="flex-1 h-9 bg-[#2b4c6d] text-slate-300 border border-slate-600 rounded-sm flex items-center justify-center active:bg-slate-500 transition-colors">
                <Square size={10} fill="currentColor" />
            </button>
            <button onClick={onTogglePlay} className={`flex-1 h-9 border rounded-sm flex items-center justify-center transition-all ${isPlaying ? 'bg-green-600 border-green-400 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[#2b4c6d] border-slate-600 text-slate-200'}`}>
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
        </div>
      </div>

      {/* PRE-AMP / AUX SECTION */}
      <div className="flex flex-col gap-2 w-full bg-[#1b324a] py-3 border-b border-slate-700/50 shrink-0">
          <div className="flex justify-center">
              <Knob value={trim} onChange={(e) => onTrimChange(parseFloat(e.target.value))} min={0.1} max={3.0} label="TRIM" sizeClass="w-7 h-7" colorClass="bg-cyan-400" />
          </div>
          <div className="flex px-1 gap-1">
              <button onClick={() => toggleAux(1)} className={`flex-1 h-6 rounded-sm border text-[8px] font-black transition-all ${aux1On ? 'bg-green-600 border-green-400 text-white shadow-inner' : 'bg-slate-900 border-slate-800 text-green-700'}`}>AUX 1</button>
              <button onClick={() => toggleAux(2)} className={`flex-1 h-6 rounded-sm border text-[8px] font-black transition-all ${aux2On ? 'bg-amber-600 border-amber-400 text-white shadow-inner' : 'bg-slate-900 border-slate-800 text-amber-700'}`}>AUX 2</button>
          </div>
      </div>

      {/* ON/OFF BUTTON */}
      <div className="w-full px-1.5 py-2 shrink-0 bg-[#0d1a25]/20">
          <button onClick={() => setIsOn(!isOn)} className={`w-full h-8 text-[9px] font-black border-2 rounded-sm transition-all uppercase tracking-widest ${isOn ? 'bg-[#ef4444] border-[#f87171] text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-[#111827] border-[#374151] text-slate-600'}`}>
            {isOn ? 'ON AIR' : 'OFF'}
          </button>
      </div>

      {/* FADER AREA - MUST FILL HEIGHT */}
      <div ref={faderContainerRef} className="flex-1 w-full flex flex-row items-end justify-center gap-1.5 px-1.5 bg-[#080c14] pt-2 overflow-hidden border-t border-slate-800 shadow-inner">
         <div className="h-full bg-black/40 p-[1px] rounded border border-slate-800/50 w-4 flex flex-col justify-end">
             <MiniVisualizer analyser={analyser} width={14} height={faderHeight - 5} segmentCount={Math.floor(faderHeight / 5)} />
         </div>
         <div className="h-full w-10 relative flex items-center justify-center bg-black/20 rounded border border-slate-800/30 overflow-hidden">
            <input 
              type="range" min="0" max="1" step="0.005" 
              value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} 
              className="fader-vertical" 
              style={{ '--fader-height': `${faderHeight}px` } as React.CSSProperties}
            />
         </div>
      </div>
             
      <div className={`w-full border-t border-slate-800 text-[8px] font-mono text-center py-1 bg-black shrink-0 ${isRne ? 'text-amber-500' : 'text-cyan-400'}`}>
          {isOn ? (volume * 10).toFixed(1) : '-∞'} dB
      </div>
    </div>
  );
};
