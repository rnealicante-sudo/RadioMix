
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RefreshCw, Activity, Zap, Waves, Settings2, Power } from 'lucide-react';
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
  isFullscreen?: boolean;
  bitrate?: number;
}

export const Deck: React.FC<DeckProps> = ({ 
    id, onTogglePlay, onStop, onRefresh, onStreamChange, onTrimChange, trim,
    onVolumeChange, onAuxLevelChange, onEqChange, onToggleEq, audioElement, analyser,
    bitrate
}) => {
  const isOcasional = id === 'A';
  const isRneEmisoras = id === 'RNE_EMISORAS';
  const isSerProvincial = id === 'F';
  const isRne = id === 'MIC' || id === 'A' || id === 'RNE_EMISORAS';

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8); 
  const [isOn, setIsOn] = useState(true); 
  
  const [aux1On, setAux1On] = useState(false);
  const [aux2On, setAux2On] = useState(false);

  // Estados de EQ
  const [eqActive, setEqActive] = useState(true);
  const [eqVisible, setEqVisible] = useState<'L' | 'M' | 'H' | null>(null);
  const [eqGains, setEqGains] = useState({ L: 0, M: 0, H: 0 });

  const faderContainerRef = useRef<HTMLDivElement>(null);
  const [faderHeight, setFaderHeight] = useState(150);

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

  useEffect(() => { onVolumeChange(isOn ? volume : 0); }, [isOn, volume]);

  useEffect(() => {
    if (!faderContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) setFaderHeight(entry.contentRect.height);
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
      if (id === 'MIC') return 'R1 CV (RNE)';
      if (id === 'A') return 'RNE OCASIONAL';
      if (id === 'RNE_EMISORAS') return 'RNE CADENAS';
      if (id === 'ES_RADIO') return 'ES RADIO';
      if (id === 'RADIO_MARCA') return 'RADIO MARCA';
      if (id === 'RADIO_ESPANA') return 'RADIO ESPAÑA';
      if (id === 'C') return 'ONDA CERO';
      if (id === 'D') return 'RADIO 5';
      if (id === 'E') return 'COPE';
      if (id === 'F') return 'SER PROVINCIAL';
      return id;
  };

  const serProvincialChannels = [
    { name: 'SER ALICANTE', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALICANTEAAC.aac" },
    { name: 'SER + ALICANTE', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_MAS_ALICANTE.mp3" },
    { name: 'SER ALCOY', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_ALCOYAAC.aac" },
    { name: 'SER DENIA', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_DENIAAAC.aac" },
    { name: 'SER ELCHE', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_ELCHE.mp3" },
    { name: 'SER ELDA', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ASO_ELDA.mp3" },
    { name: 'SER + ALCOY', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_MAS_ASO_ALCOY.mp3" },
    { name: 'SER VILLENA', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_VILLENA.mp3" },
  ];

  const rneCadenasChannels = [
    { name: 'RNE 1', url: "https://rnelivestream.rtve.es/rne1/val/master.m3u8" },
    { name: 'R. Clasica', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8" },
    { name: 'Radio 3', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r3_main.m3u8" },
    { name: 'Radio 4', url: "https://rnelivestream.rtve.es/rner4/main/master.m3u8" },
    { name: 'Radio 5', url: "https://rnelivestream.rtve.es/rne5/ali/master.m3u8" },
    { name: 'REE', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_re_main.m3u8" },
  ];

  const rneOcasionalChannels = [
    { name: 'OCA 1', url: "https://rnelivestream.rtve.es/rneoca/oca1/master.m3u8" },
    { name: 'OCA 2', url: "https://rnelivestream.rtve.es/rneoca/oca2/master.m3u8" },
    { name: 'OCA 3', url: "https://rnelivestream.rtve.es/rneoca/oca3/master.m3u8" },
    { name: 'OCA 4', url: "https://rnelivestream.rtve.es/rneoca/oca4/master.m3u8" },
    { name: 'OCA 5', url: "https://rnelivestream.rtve.es/rneoca/oca5/master.m3u8" },
    { name: 'OCA 6', url: "https://rnelivestream.rtve.es/rneoca/oca6/master.m3u8" },
  ];

  const streamFormat = audioElement?.src?.includes('.m3u8') ? 'HLS/ADAPT' : 'MPEG/FIXED';
  const labelColorClass = isRne ? 'text-amber-500' : (isSerProvincial ? 'text-yellow-400' : 'text-cyan-400');

  return (
    <div className={`flex flex-col items-center border-r border-[#15283d] flex-1 min-w-[95px] h-full relative group pb-1 bg-[#1e3a57]`}>
      
      {/* CABECERA */}
      <div className="w-full text-center py-1 bg-[#112233] border-b border-[#2d4b6b] mb-1 shrink-0">
          <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 opacity-70">NET STREAM</div>
          <div className={`text-[9px] font-black tracking-tighter truncate px-1 ${labelColorClass}`}>
              {getSubLabel()}
          </div>
      </div>

      {/* SELECTOR SEÑAL */}
      <div className="w-full px-1 mb-2 mt-1 shrink-0">
        <div className="flex flex-col gap-1">
            {(isOcasional || isRneEmisoras || isSerProvincial) ? (
                <select onChange={(e) => onStreamChange?.(e.target.value)} className="w-full bg-[#0d1a25] text-[8px] text-amber-500 border border-amber-800/50 rounded px-1 py-1 outline-none font-bold">
                    {(isOcasional ? rneOcasionalChannels : isRneEmisoras ? rneCadenasChannels : serProvincialChannels).map(c => <option key={c.url} value={c.url}>{c.name}</option>)}
                </select>
            ) : (
                <div className="text-[8px] font-bold truncate h-4 w-full text-center bg-[#0d1a25] rounded leading-4 border border-slate-800 text-slate-400 uppercase">LINKED</div>
            )}
            
            <div className="flex gap-1">
                <button onClick={onStop} className="flex-1 bg-[#2b4c6d] text-slate-300 border border-slate-600 rounded py-1 flex justify-center"><Square size={10} fill="currentColor" /></button>
                <button onClick={onTogglePlay} className={`flex-1 border rounded py-1 flex justify-center transition-all ${isPlaying ? 'bg-green-600 border-green-400 text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-[#2b4c6d] border-slate-600 text-slate-200'}`}>{isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}</button>
            </div>
        </div>
      </div>

      {/* TRIM */}
      <div className="mb-2 w-full flex justify-center border-b border-slate-700/50 pb-2 bg-[#1b324a] shrink-0">
          <Knob value={trim} onChange={(e) => onTrimChange(parseFloat(e.target.value))} min={0.1} max={3.0} label="TRIM" colorClass="bg-cyan-400" />
      </div>

      {/* EQ SECTION (ACTUALIZADA CON BYPASS) */}
      <div className="w-full px-1.5 py-2 flex flex-col gap-1.5 bg-[#0a1520] border-y border-[#1a2e45] shrink-0 relative">
          <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-1 opacity-60">
                  <Waves size={8} className="text-cyan-500" />
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">3-Band EQ</span>
              </div>
              <button 
                onClick={handleToggleEq}
                className={`w-5 h-3 rounded-full border transition-all flex items-center justify-center ${eqActive ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'bg-slate-800 border-slate-700'}`}
                title={eqActive ? "EQ ON" : "EQ OFF (Bypass)"}
              >
                <div className={`w-1 h-1 rounded-full ${eqActive ? 'bg-white' : 'bg-slate-600'}`}></div>
              </button>
          </div>
          
          {/* EQ SLIDERS OVERLAY */}
          {eqVisible && (
            <div className="absolute bottom-full left-0 w-full h-[100px] bg-[#050b12] border border-slate-700 rounded-t-sm z-30 flex flex-col items-center justify-center p-2 shadow-2xl">
                <div className="flex-1 flex flex-col items-center w-full">
                    <span className="text-[7px] font-black text-white/50 mb-1">{eqVisible === 'L' ? 'LOW (100Hz)' : eqVisible === 'M' ? 'MID (1kHz)' : 'HIGH (8kHz)'}</span>
                    <input 
                      type="range" min="-12" max="12" step="0.5" 
                      value={eqGains[eqVisible]} 
                      onChange={(e) => handleEqChange(eqVisible, parseFloat(e.target.value))}
                      className="fader-vertical-small h-[60px]"
                    />
                    <span className="text-[8px] font-mono text-cyan-400 mt-1 font-bold">{eqGains[eqVisible] > 0 ? '+' : ''}{eqGains[eqVisible]} dB</span>
                </div>
                <button onClick={() => setEqVisible(null)} className="mt-1 w-full text-[6px] font-black text-slate-500 hover:text-white uppercase border border-slate-800 rounded bg-slate-900 py-0.5">Cerrar</button>
            </div>
          )}

          <div className="flex w-full gap-1">
              {(['L', 'M', 'H'] as const).map(band => (
                  <button 
                    key={band} 
                    onClick={() => setEqVisible(eqVisible === band ? null : band)}
                    className={`flex-1 h-6 rounded-sm border text-[8px] font-black transition-all ${eqVisible === band ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_8px_rgba(8,145,178,0.6)]' : Math.abs(eqGains[band]) > 0 && eqActive ? 'bg-cyan-900/40 border-cyan-800 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-600'} ${!eqActive && 'opacity-40'}`}
                  >
                    {band}
                  </button>
              ))}
          </div>
      </div>

      {/* AUX KEYS */}
      <div className="w-full px-2 py-2 flex flex-col gap-1.5 bg-[#0a1520] border-b border-[#1a2e45] shrink-0">
          <div className="flex w-full gap-1">
              <button onClick={() => toggleAux(1)} className={`flex-1 h-6 rounded-sm border text-[8px] font-black transition-all ${aux1On ? 'bg-green-600 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>AUX 1</button>
              <button onClick={() => toggleAux(2)} className={`flex-1 h-6 rounded-sm border text-[8px] font-black transition-all ${aux2On ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.6)]' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>AUX 2</button>
          </div>
      </div>

      {/* TELEMETRY */}
      <div className="w-full px-1.5 py-1.5 flex flex-col gap-0.5 bg-[#050b12] border-b border-slate-800 shrink-0">
          <div className="flex justify-between items-center bg-black/40 px-1.5 py-0.5 rounded-sm">
              <span className="text-[6px] font-bold text-slate-600 uppercase">Format</span>
              <span className="text-[7px] font-mono text-cyan-400 font-black tracking-tighter">{streamFormat}</span>
          </div>
          <div className="flex justify-between items-center bg-black/40 px-1.5 py-0.5 rounded-sm">
              <span className="text-[6px] font-bold text-slate-600 uppercase">Bitrate</span>
              <span className="text-[8px] font-mono text-amber-500 font-black">{bitrate || '--'} <span className="text-[5px]">KB/S</span></span>
          </div>
      </div>

      {/* ON/OFF */}
      <div className="w-full px-2 py-2 flex justify-center bg-[#152535] shrink-0">
          <button onClick={() => setIsOn(!isOn)} className={`w-14 h-8 text-[10px] font-black border-2 rounded-sm transition-all ${isOn ? 'bg-[#ef4444] border-[#f87171] text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-[#1e293b] border-[#334155] text-slate-600'}`}>
            {isOn ? 'ON' : 'OFF'}
          </button>
      </div>

      {/* FADER */}
      <div ref={faderContainerRef} className="flex-1 w-full flex flex-row items-end justify-center gap-1 px-1 bg-[#0d1a25] pt-2 overflow-hidden border-t border-slate-800">
         <div className="h-full bg-black/40 p-[1px] rounded border border-slate-800/50 w-5 flex flex-col justify-end">
             <MiniVisualizer analyser={analyser} width={16} height={faderHeight - 10} segmentCount={Math.floor(faderHeight / 4)} />
         </div>
         <div className="h-full w-9 relative flex items-center justify-center bg-black/40 rounded border border-slate-800/50 overflow-hidden shadow-inner">
            <input 
              type="range" min="0" max="1" step="0.005" 
              value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} 
              className="fader-vertical" 
              style={{ '--fader-height': `${faderHeight}px` } as React.CSSProperties}
            />
         </div>
      </div>
             
      <div className={`w-[90%] border text-[9px] font-mono text-center py-0.5 rounded-sm mt-1 bg-black shrink-0 ${isRne ? 'border-amber-800 text-amber-500' : 'border-cyan-800 text-cyan-400'}`}>
          {(volume * 10).toFixed(1)} dB
      </div>

      <style>{`
        .fader-vertical-small {
          -webkit-appearance: none;
          width: 60px;
          height: 6px;
          background: #0f172a;
          transform: rotate(-90deg);
          border-radius: 4px;
          cursor: pointer;
        }
        .fader-vertical-small::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 10px;
          background: #22d3ee;
          border-radius: 2px;
          box-shadow: 0 0 5px rgba(34,211,238,0.5);
        }
      `}</style>
    </div>
  );
};
