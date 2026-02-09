
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic, Square, RefreshCw, Activity, Waves } from 'lucide-react';
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
  onAssignmentChange: (value: CrossfaderAssignment) => void;
  assignment: CrossfaderAssignment;
  audioElement: HTMLAudioElement | null | undefined;
  analyser: AnalyserNode | null | undefined;
  aux1Active: boolean;
  onToggleAux1: () => void;
  aux2Active: boolean;
  onToggleAux2: () => void;
  inputDevices?: MediaDeviceInfo[];
  onMicSelect?: (deviceId: string) => void;
  isFullscreen?: boolean;
}

export const Deck: React.FC<DeckProps> = ({ 
    id, onTogglePlay, onStop, onStreamChange, onTrimChange, trim,
    onVolumeChange, audioElement, analyser, aux1Active, onToggleAux1, aux2Active, onToggleAux2,
    inputDevices = [], onMicSelect, isFullscreen
}) => {
  const isLiveMic = id === 'LIVE_MIC';
  const isOcasional = id === 'A';
  const isRneEmisoras = id === 'RNE_EMISORAS';
  const isRadio = !isLiveMic;

  const isRne = id === 'MIC' || id === 'A' || id === 'RNE_EMISORAS';

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8); 
  const [isOn, setIsOn] = useState(true); 

  // Estados locales para los nuevos botones de proceso
  const [eqState, setEqState] = useState({ low: false, mid: false, high: false });
  const [dynState, setDynState] = useState({ comp: false, gate: false });

  // Ref para calcular la altura dinámica del fader
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

  // Observer para ajustar la altura del fader automáticamente
  useEffect(() => {
    if (!faderContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setFaderHeight(entry.contentRect.height);
      }
    });
    observer.observe(faderContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const ocasionalChannels = [
    { name: 'RNE OCA 1', url: "https://rnelivestream.rtve.es/rneoca/oca1/master.m3u8" },
    { name: 'RNE OCA 2', url: "https://rnelivestream.rtve.es/rneoca/oca2/master.m3u8" },
    { name: 'RNE OCA 3', url: "https://rnelivestream.rtve.es/rneoca/oca3/master.m3u8" },
    { name: 'RNE OCA 4', url: "https://rnelivestream.rtve.es/rneoca/oca4/master.m3u8" },
    { name: 'RNE OCA 5', url: "https://rnelivestream.rtve.es/rneoca/oca5/master.m3u8" },
    { name: 'RNE OCA 6', url: "https://rnelivestream.rtve.es/rneoca/oca6/master.m3u8" },
  ];

  const rneEmisorasChannels = [
      { name: 'R. Clasica', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8" },
      { name: 'Radio 3', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r3_main.m3u8" },
      { name: 'Radio 4 CAT', url: "https://rnelivestream.rtve.es/rner4/main/master.m3u8" },
      { name: 'REE', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_re_main.m3u8" },
  ];

  const getSubLabel = () => {
      if (id === 'LIVE_MIC') return 'LIVE MIC';
      if (id === 'MIC') return 'R1 CV (RNE)';
      if (id === 'A') return 'OCASIONAL (RNE)';
      if (id === 'RNE_EMISORAS') return 'RNE EMISORAS';
      if (id === 'RADIO_UMH') return 'RADIO UMH';
      if (id === 'ES_RADIO') return 'ES RADIO';
      if (id === 'RADIO_MARCA') return 'RADIO MARCA';
      if (id === 'RADIO_ESPANA') return 'RADIO ESPAÑA';
      if (id === 'C') return 'ONDA CERO ALI';
      if (id === 'D') return 'RADIO 5 ALI';
      if (id === 'E') return 'COPE ALI';
      if (id === 'F') return 'SER ALI';
      return id;
  };

  const getHeaderLabel = () => {
    if (isLiveMic) return 'Hardware';
    if (id === 'RADIO_UMH') return 'UNIVERSIDAD';
    if (id === 'RADIO_MARCA') return 'DEPORTES';
    if (id === 'C' || id === 'D' || id === 'E' || id === 'F' || id === 'ES_RADIO' || id === 'RADIO_ESPANA') return 'Broadcast';
    return 'RADIO NACIONAL';
  };

  const handleRefresh = () => {
    if (onStreamChange && audioElement) {
        const currentSrc = audioElement.src || "";
        onStreamChange(currentSrc);
    }
  };

  const renderFormattedLabel = (text: string) => {
    if (text.includes('(RNE)')) {
      const parts = text.split('(RNE)');
      return (
        <>
          {parts[0]}
          <span className="text-amber-500 font-black">(RNE)</span>
          {parts[1]}
        </>
      );
    }
    return text;
  };

  const labelColorClass = isLiveMic ? 'text-sky-400' : 'text-cyan-400';
  const headerLabelColorClass = isRne ? 'text-amber-600/80' : 'text-slate-500';

  return (
    <div className={`flex flex-col items-center border-r border-[#15283d] flex-1 min-w-[85px] h-full relative group pb-1 ${isLiveMic ? 'bg-[#162d42]' : 'bg-[#1e3a57]'}`}>
      <div className="w-full text-center py-1 bg-[#112233] border-b border-[#2d4b6b] mb-1">
          <div className={`text-[8px] font-bold uppercase tracking-tighter ${headerLabelColorClass}`}>{getHeaderLabel()}</div>
          <div className={`text-[9px] font-black tracking-tighter truncate px-1 ${labelColorClass}`}>
              {renderFormattedLabel(getSubLabel())}
          </div>
      </div>

      <div className="w-full px-1 mb-2 mt-1">
        <div className="flex flex-col gap-1">
            {isLiveMic ? (
                <select onChange={(e) => onMicSelect?.(e.target.value)} className="w-full bg-[#0d1a25] text-[8px] text-sky-400 border border-sky-800/50 rounded px-1 py-1 outline-none cursor-pointer appearance-none">
                    <option value="default">Default Mic</option>
                    {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Mic'}</option>)}
                </select>
            ) : isOcasional ? (
                <select onChange={(e) => { onStreamChange?.(e.target.value); }} className="w-full bg-[#0d1a25] text-[8px] text-amber-400 border border-amber-800/50 rounded px-1 py-1 outline-none cursor-pointer appearance-none">
                    {ocasionalChannels.map(c => <option key={c.url} value={c.url}>{c.name}</option>)}
                </select>
            ) : isRneEmisoras ? (
                <select onChange={(e) => { onStreamChange?.(e.target.value); }} className="w-full bg-[#0d1a25] text-[8px] text-amber-400 border border-amber-800/50 rounded px-1 py-1 outline-none cursor-pointer appearance-none">
                    {rneEmisorasChannels.map(c => <option key={c.url} value={c.url}>{c.name}</option>)}
                </select>
            ) : (
                <div className={`text-[8px] font-bold truncate h-4 w-full text-center bg-[#0d1a25] rounded leading-4 border border-slate-800 ${isRne ? 'text-slate-200' : 'text-slate-400'}`}>
                    {renderFormattedLabel(getSubLabel())}
                </div>
            )}
            
            <div className="flex gap-1">
                {isRadio && <button onClick={handleRefresh} title="Reiniciar Stream" className="flex-1 bg-cyan-900/30 text-cyan-500 border border-cyan-800/50 rounded py-1 flex justify-center hover:bg-cyan-800/50 transition-colors"><RefreshCw size={10} /></button>}
                {!isLiveMic && (
                  <>
                    <button onClick={onStop} className="flex-1 bg-[#2b4c6d] hover:bg-[#3b5e80] text-slate-200 border border-slate-600 rounded py-1 flex justify-center"><Square size={10} fill="currentColor" /></button>
                    <button onClick={onTogglePlay} className={`flex-1 border rounded py-1 flex justify-center transition-colors ${isPlaying ? 'bg-green-600 border-green-400 text-white animate-pulse' : 'bg-[#2b4c6d] border-slate-600 text-slate-200'}`}>{isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}</button>
                  </>
                )}
                {isLiveMic && <div className="w-full h-[18px] flex items-center justify-center bg-sky-900/20 rounded border border-sky-800/30"><Mic size={10} className="text-sky-400 animate-pulse" /></div>}
            </div>
        </div>
      </div>

      <div className="mb-2 w-full flex justify-center border-b border-slate-700 pb-2 bg-[#1b324a]">
          <Knob value={trim} onChange={(e) => onTrimChange(parseFloat(e.target.value))} min={0.1} max={3.0} label="GAIN" colorClass={isLiveMic ? "bg-sky-400" : (isRne ? "bg-amber-400" : "bg-cyan-400")} />
      </div>

      <div className="w-full px-2 flex flex-col gap-1 mb-2">
          <div className="flex gap-1">
            <button onClick={onToggleAux1} className={`flex-1 py-0.5 text-[9px] font-black border rounded transition-all ${aux1Active ? 'bg-green-500 border-green-400 text-black shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>A1</button>
            <button onClick={onToggleAux2} className={`flex-1 py-0.5 text-[9px] font-black border rounded transition-all ${aux2Active ? 'bg-orange-500 border-orange-400 text-black shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>A2</button>
          </div>
      </div>

      <div className="w-full px-2 flex gap-1 mb-2 justify-center">
          <button onClick={() => setIsOn(!isOn)} className={`w-12 h-8 text-[9px] font-bold border-2 rounded-sm transition-all ${isOn ? 'bg-[#ef4444] border-[#991b1b] text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-[#1e293b] border-[#334155] text-slate-500'}`}>ON</button>
      </div>

      {/* SECCIÓN DE EQ Y DYN */}
      <div className="w-full px-2 py-1 flex flex-col gap-2 bg-[#0a1520] border-y border-[#1a2e45]">
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-60 px-1">
                  <Waves size={8} className="text-cyan-400" />
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">EQ Band</span>
              </div>
              <div className="flex gap-1">
                  <button onClick={() => setEqState(s => ({...s, low: !s.low}))} className={`flex-1 text-[8px] font-black border rounded py-1 transition-all ${eqState.low ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_5px_rgba(8,145,178,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>L</button>
                  <button onClick={() => setEqState(s => ({...s, mid: !s.mid}))} className={`flex-1 text-[8px] font-black border rounded py-1 transition-all ${eqState.mid ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_5px_rgba(8,145,178,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>M</button>
                  <button onClick={() => setEqState(s => ({...s, high: !s.high}))} className={`flex-1 text-[8px] font-black border rounded py-1 transition-all ${eqState.high ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_5px_rgba(8,145,178,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>H</button>
              </div>
          </div>
          <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 opacity-60 px-1">
                  <Activity size={8} className="text-amber-500" />
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Dynamics</span>
              </div>
              <div className="flex gap-1">
                  <button onClick={() => setDynState(s => ({...s, comp: !s.comp}))} className={`flex-1 text-[8px] font-black border rounded py-1 transition-all ${dynState.comp ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_5px_rgba(217,119,6,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>COMP</button>
                  <button onClick={() => setDynState(s => ({...s, gate: !s.gate}))} className={`flex-1 text-[8px] font-black border rounded py-1 transition-all ${dynState.gate ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_5px_rgba(217,119,6,0.5)]' : 'bg-[#152535] border-slate-700 text-slate-500'}`}>GATE</button>
              </div>
          </div>
      </div>

      {/* ÁREA DEL FADER - EXPANDIDA AL 100% DEL ESPACIO RESTANTE */}
      <div ref={faderContainerRef} className="flex-1 w-full flex flex-row items-end justify-center gap-1 px-1 bg-[#152535] border-t border-slate-800 pt-1 overflow-hidden">
         <div className="h-full bg-[#0d1825] p-[1px] rounded border border-slate-800 w-5 flex flex-col justify-end">
             <MiniVisualizer analyser={analyser} width={16} height={faderHeight - 10} segmentCount={Math.floor(faderHeight / 4)} />
         </div>
         <div className="h-full w-8 relative flex items-center justify-center bg-[#0d1825] rounded border border-slate-800 overflow-hidden">
            <input 
              type="range" 
              min="0" max="1" step="0.005" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))} 
              className="fader-vertical" 
              style={{ '--fader-height': `${faderHeight}px` } as React.CSSProperties}
            />
         </div>
      </div>
             
      <div className={`w-[90%] border text-[9px] font-mono text-center py-0.5 rounded-sm mt-1 bg-black ${isLiveMic ? 'border-sky-800 text-sky-400' : (isRne ? 'border-amber-800 text-amber-500' : 'border-cyan-800 text-cyan-400')}`}>
          {(volume * 10).toFixed(1)}dB
      </div>
    </div>
  );
};
