
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Square, Waves } from 'lucide-react';
import { MiniVisualizer } from './MiniVisualizer';
import { DeckId, CrossfaderAssignment } from '../types';
import { Knob } from './Knob';

interface DeckProps {
  id: DeckId;
  onLoad: (file: File) => void;
  onTogglePlay: () => void;
  onStop?: () => void;
  onRefresh?: () => void;
  onStreamChange?: (url: string) => void;
  onTrimChange: (value: number) => void;
  trim: number;
  onVolumeChange: (value: number) => void;
  onAuxLevelChange: (auxIdx: 1 | 2, value: number) => void;
  onEqChange: (band: 'L' | 'M' | 'H', value: number) => void;
  onToggleEq: () => void;
  onAssignmentChange: (value: CrossfaderAssignment) => void;
  assignment: CrossfaderAssignment;
  audioElement: HTMLAudioElement | null | undefined;
  analyser: AnalyserNode | null | undefined;
  inputDevices?: MediaDeviceInfo[];
  onMicSelect?: (deviceId: string) => void;
  bitrate?: number;
}

export const Deck: React.FC<DeckProps> = ({ 
    id, onTogglePlay, onStop, onStreamChange, onTrimChange, trim,
    onVolumeChange, onAuxLevelChange, onEqChange, onToggleEq, audioElement, analyser,
    inputDevices = [], onMicSelect, bitrate
}) => {
  const isLiveMic = id === 'LIVE_MIC';
  const isOcasional = id === 'A';
  const isRneEmisoras = id === 'RNE_EMISORAS';
  const isSerProvincial = id === 'F';
  const isRne = id === 'MIC' || id === 'A' || id === 'RNE_EMISORAS';

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8); 
  const [isOn, setIsOn] = useState(true); 
  const [aux1On, setAux1On] = useState(false);
  const [aux2On, setAux2On] = useState(false);
  const [eqActive, setEqActive] = useState(true);
  const [eqVisible, setEqVisible] = useState<'L' | 'M' | 'H' | null>(null);
  const [eqGains, setEqGains] = useState({ L: 0, M: 0, H: 0 });

  const faderContainerRef = useRef<HTMLDivElement>(null);
  const [faderHeight, setFaderHeight] = useState(120);

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

  useEffect(() => { onVolumeChange(isOn ? volume : 0); }, [isOn, volume, onVolumeChange]);

  useEffect(() => {
    if (!faderContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setFaderHeight(Math.max(80, entry.contentRect.height));
      }
    });
    observer.observe(faderContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleAux = (idx: 1 | 2) => {
    if (idx === 1) {
      const newState = !aux1On; setAux1On(newState); onAuxLevelChange(1, newState ? 1.0 : 0.0);
    } else {
      const newState = !aux2On; setAux2On(newState); onAuxLevelChange(2, newState ? 1.0 : 0.0);
    }
  };

  const handleToggleEq = () => {
    setEqActive(!eqActive);
    onToggleEq();
  };

  const handleEqChange = (band: 'L' | 'M' | 'H', val: number) => {
    setEqGains(prev => ({ ...prev, [band]: val }));
    onEqChange(band, val);
  };

  const getSubLabel = () => {
      if (id === 'LIVE_MIC') return 'LIVE MIC';
      if (id === 'MIC') return 'R1 CV (RNE)';
      if (id === 'A') return 'RNE OCA';
      if (id === 'RNE_EMISORAS') return 'RNE CAD';
      if (id === 'ES_RADIO') return 'ES RADIO';
      if (id === 'RADIO_MARCA') return 'R. MARCA';
      if (id === 'RADIO_ESPANA') return 'R. ESPAÑA';
      if (id === 'C') return 'ONDA CERO';
      if (id === 'D') return 'RADIO 5';
      if (id === 'E') return 'COPE';
      if (id === 'F') return 'SER PROV';
      return id;
  };

  const serProvincialChannels = [
    { name: 'SER ALICANTE', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALICANTEAAC.aac" },
    { name: 'SER ELCHE', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_ELCHE.mp3" },
    { name: 'SER DENIA', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_DENIAAAC.aac" },
  ];

  const labelColorClass = isLiveMic ? 'text-sky-400' : (isRne ? 'text-amber-500' : (isSerProvincial ? 'text-yellow-400' : 'text-cyan-400'));

  return (
    <div className={`flex flex-col items-center border-r border-[#15283d] flex-1 min-w-[85px] md:min-w-[100px] h-full relative group pb-1 ${isLiveMic ? 'bg-[#162d42]' : 'bg-[#1e3a57]'}`}>
      
      {/* HEADER */}
      <div className="w-full text-center py-1 bg-[#112233] border-b border-[#2d4b6b] mb-1 shrink-0">
          <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 opacity-70">{isLiveMic ? 'HW' : 'NET'}</div>
          <div className={`text-[8px] md:text-[9px] font-black tracking-tighter truncate px-1 ${labelColorClass}`}>
              {getSubLabel()}
          </div>
      </div>

      {/* SELECTOR */}
      <div className="w-full px-1 mb-1.5 shrink-0">
        <div className="flex flex-col gap-1">
            {isLiveMic ? (
                <select onChange={(e) => onMicSelect?.(e.target.value)} className="w-full bg-[#0d1a25] text-[7px] md:text-[8px] text-sky-400 border border-sky-800/50 rounded px-1 py-0.5 outline-none font-bold appearance-none">
                    <option value="default">MAIN MIC</option>
                    {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Mic'}</option>)}
                </select>
            ) : (isOcasional || isRneEmisoras || isSerProvincial) ? (
                <select onChange={(e) => onStreamChange?.(e.target.value)} className="w-full bg-[#0d1a25] text-[7px] md:text-[8px] text-amber-500 border border-amber-800/50 rounded px-1 py-0.5 outline-none font-bold">
                    {serProvincialChannels.map(c => <option key={c.url} value={c.url}>{c.name}</option>)}
                </select>
            ) : (
                <div className="text-[7px] md:text-[8px] font-bold truncate h-4 w-full text-center bg-[#0d1a25] rounded leading-4 border border-slate-800 text-slate-500 uppercase">SYNC</div>
            )}
            
            <div className="flex gap-1">
                {!isLiveMic && (
                  <>
                    <button onClick={onStop} className="flex-1 bg-[#2b4c6d] text-slate-300 border border-slate-600 rounded py-1 flex justify-center"><Square size={8} fill="currentColor" /></button>
                    <button onClick={onTogglePlay} className={`flex-1 border rounded py-1 flex justify-center transition-all ${isPlaying ? 'bg-green-600 border-green-400 text-white' : 'bg-[#2b4c6d] border-slate-600 text-slate-200'}`}>{isPlaying ? <Pause size={8} fill="currentColor" /> : <Play size={8} fill="currentColor" />}</button>
                  </>
                )}
                {isLiveMic && <div className="w-full h-[18px] flex items-center justify-center bg-sky-900/40 rounded border border-sky-400/30"><Mic size={10} className="text-sky-400 animate-pulse" /></div>}
            </div>
        </div>
      </div>

      {/* TRIM */}
      <div className="mb-1 w-full flex justify-center border-b border-slate-700/50 pb-1.5 bg-[#1b324a] shrink-0">
          <Knob value={trim} onChange={(e) => onTrimChange(parseFloat(e.target.value))} min={0.1} max={3.0} label="TRIM" colorClass={isLiveMic ? "bg-sky-400" : "bg-cyan-400"} sizeClass="w-5 h-5 md:w-7 md:h-7" />
      </div>

      {/* EQ */}
      <div className="w-full px-1 py-1.5 flex flex-col gap-1 bg-[#0a1520] border-y border-[#1a2e45] shrink-0 relative">
          <div className="flex items-center justify-between px-1 mb-0.5">
              <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest">EQ</span>
              <button onClick={handleToggleEq} className={`w-4 h-2 rounded-full border transition-all ${eqActive ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'bg-slate-800 border-slate-700'}`}></button>
          </div>
          
          <div className="flex w-full gap-0.5">
              {(['L', 'M', 'H'] as const).map(band => (
                  <button 
                    key={band} 
                    onClick={() => setEqVisible(eqVisible === band ? null : band)}
                    className={`flex-1 h-5 rounded-sm border text-[7px] md:text-[8px] font-black transition-all ${eqVisible === band ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                  >
                    {band}
                  </button>
              ))}
          </div>

          {eqVisible && (
            <div className="absolute bottom-full left-0 w-full h-[80px] bg-[#050b12] border border-slate-700 rounded-t-sm z-30 flex flex-col items-center justify-center p-1 shadow-2xl">
                <input 
                  type="range" min="-12" max="12" step="0.5" 
                  value={eqGains[eqVisible]} 
                  onChange={(e) => handleEqChange(eqVisible, parseFloat(e.target.value))}
                  className="fader-vertical-small h-[50px]"
                />
                <button onClick={() => setEqVisible(null)} className="mt-1 w-full text-[6px] text-slate-500 uppercase">OK</button>
            </div>
          )}
      </div>

      {/* AUX KEYS */}
      <div className="w-full px-1 py-1.5 flex flex-col gap-1 bg-[#0a1520] border-b border-[#1a2e45] shrink-0">
          <div className="flex w-full gap-0.5">
              <button onClick={() => toggleAux(1)} className={`flex-1 h-5 rounded-sm border text-[7px] md:text-[8px] font-black transition-all ${aux1On ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>A1</button>
              <button onClick={() => toggleAux(2)} className={`flex-1 h-5 rounded-sm border text-[7px] md:text-[8px] font-black transition-all ${aux2On ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>A2</button>
          </div>
      </div>

      {/* ON/OFF */}
      <div className="w-full px-1 py-1.5 flex justify-center bg-[#152535] shrink-0">
          <button onClick={() => setIsOn(!isOn)} className={`w-full h-6 text-[8px] md:text-[9px] font-black border rounded-sm transition-all ${isOn ? 'bg-[#ef4444] border-[#f87171] text-white' : 'bg-[#1e293b] border-[#334155] text-slate-600'}`}>
            {isOn ? 'ON' : 'OFF'}
          </button>
      </div>

      {/* FADER AREA - Dinámica */}
      <div ref={faderContainerRef} className="flex-1 w-full flex flex-row items-end justify-center gap-1 px-1 bg-[#0d1a25] pt-1 overflow-hidden border-t border-slate-800 shadow-inner">
         <div className="h-full bg-black/40 p-[1px] rounded border border-slate-800/50 w-4 flex flex-col justify-end">
             <MiniVisualizer analyser={analyser} width={12} height={faderHeight - 8} segmentCount={Math.floor(faderHeight / 4)} />
         </div>
         <div className="h-full w-8 relative flex items-center justify-center bg-black/40 rounded border border-slate-800/50 overflow-hidden">
            <input 
              type="range" min="0" max="1" step="0.005" 
              value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} 
              className="fader-vertical" 
              style={{ width: `${faderHeight}px` } as React.CSSProperties}
            />
         </div>
      </div>
             
      <div className="w-[90%] border border-slate-800 text-[8px] font-mono text-center py-0.5 rounded-sm mt-1 bg-black shrink-0 text-slate-500">
          {(volume * 10).toFixed(1)}
      </div>

      <style>{`
        .fader-vertical-small {
          -webkit-appearance: none;
          width: 50px;
          height: 4px;
          background: #0f172a;
          transform: rotate(-90deg);
          border-radius: 4px;
          cursor: pointer;
        }
        .fader-vertical-small::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 8px;
          background: #22d3ee;
          border-radius: 1px;
        }
      `}</style>
    </div>
  );
};
