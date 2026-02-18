
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Deck } from './components/Deck';
import { Visualizer } from './components/Visualizer';
import { Recorder } from './components/Recorder';
import { useAudioMixer } from './hooks/useAudioMixer';
import { fetchAlicanteNews, fetchAlicanteWeather, NewsItem, WeatherData } from './services/geminiService';
import { Zap, ShieldAlert, RefreshCw, Thermometer, Radio, Clock, Volume2, Maximize, Minimize, Wifi, Settings, Activity } from 'lucide-react';
import { DeckId } from './types';
import { NewsTicker as NewsTickerComponent } from './components/NewsTicker';
import { Knob } from './components/Knob';

export default function App() {
  const { 
    togglePlay, stopTrack, setDeckTrim, setDeckVolume, setMasterVolume, setDeckEq, toggleDeckEq,
    getMasterAnalyser, getAuxAnalyser, getAux2Analyser, getDeckAnalyser, getDeckElement,
    allDeckIds, decksBitrate, activeStation,
    isLimiterActive, toggleLimiter, isCompressorActive, toggleCompressor, 
    recorders, startRecording, stopRecording, clearRecorder, exportRecording, setFormat,
    changeStream, setAuxLevel,
    outputDevices, setOutputDevice, setAuxMasterVolume,
    refreshAllStreams,
    setSchedule,
    isAnyPlaying
  } = useAudioMixer();

  const [masterVol, setMasterVol] = useState(0.8);
  const [aux1Vol, setAux1Vol] = useState(1.0);
  const [aux2Vol, setAux2Vol] = useState(1.0);
  
  const [isOnAir, setIsOnAir] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: "--°C", condition: "Sincronizando..." });
  const [engineReady, setEngineReady] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Ref para calcular altura del Master Fader
  const masterFaderContainerRef = useRef<HTMLDivElement>(null);
  const [masterFaderHeight, setMasterFaderHeight] = useState(160);

  useEffect(() => {
    if (masterFaderContainerRef.current) {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                setMasterFaderHeight(entry.contentRect.height);
            }
        });
        observer.observe(masterFaderContainerRef.current);
        return () => observer.disconnect();
    }
  }, []);

  // Control automático de ON AIR
  useEffect(() => {
    setIsOnAir(engineReady && isAnyPlaying && masterVol > 0.05);
  }, [engineReady, isAnyPlaying, masterVol]);

  const loadData = useCallback(async () => {
    setNewsLoading(true);
    try {
      const [aNews, aWeather] = await Promise.all([ fetchAlicanteNews(), fetchAlicanteWeather() ]);
      setNews(aNews); setWeather(aWeather);
    } catch (e) { console.error(e); }
    finally { setNewsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30 * 60 * 1000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(clockInterval); };
  }, [loadData]);

  const handleStartEngine = () => { setMasterVolume(masterVol); setEngineReady(true); };

  return (
    <div className="flex-1 flex flex-col bg-[#0b111a] text-slate-300 font-sans overflow-hidden h-full w-full">
      {!engineReady && (
        <div className="fixed inset-0 z-[100] bg-[#0b111a] flex flex-col items-center justify-center p-6 text-center">
            <Radio size={80} className="text-cyan-500 mb-8 animate-pulse" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">REVOX-MIX DIGITAL PRO</h1>
            <button onClick={handleStartEngine} className="bg-cyan-600 hover:bg-cyan-500 text-white px-16 py-5 rounded-full font-black text-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] transition-all">ACTIVAR ESTUDIO</button>
        </div>
      )}

      <main className="flex-1 flex flex-col bg-[#0d141f] w-full h-full relative overflow-hidden">
        <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
            <div className="flex-1 flex flex-col bg-[#1c3550] w-full shadow-2xl border border-slate-700 overflow-hidden rounded-lg">
                <div className="flex items-center bg-[#050910] border-b border-slate-800 shadow-lg w-full h-[80px]">
                    <div className="w-[200px] flex flex-col items-center justify-center border-r border-slate-800/60 h-full bg-[#080c14]">
                        <div className={`rounded-sm border-2 font-black transition-all px-6 py-2 ${isOnAir ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-[#0f0f0f] border-slate-900 text-slate-800'}`}>ON AIR</div>
                    </div>
                    <div className="flex-1 h-full px-4 overflow-hidden"><Visualizer analyser={getMasterAnalyser()} /></div>
                    <div className="w-[200px] flex flex-col items-center justify-center border-l border-slate-800/60 h-full bg-[#080c14]"><span className="text-[16px] font-black text-slate-100 tracking-[0.3em] uppercase italic">REVOX<span className="text-cyan-500">MIX</span></span></div>
                </div>

                <div className="flex flex-1 w-full bg-[#16293d] overflow-hidden p-2 gap-2">
                    {/* DECK RACK */}
                    <div className="flex flex-1 gap-[2px] bg-[#0f172a] p-[2px] rounded border border-slate-800 shadow-inner h-full overflow-x-auto custom-scrollbar">
                        {allDeckIds.map((deckId) => (
                            <Deck 
                                key={deckId} id={deckId}
                                onLoad={() => {}} onTogglePlay={() => togglePlay(deckId)} onStop={() => stopTrack(deckId)}
                                onStreamChange={(url) => changeStream(deckId, url)} onTrimChange={(v) => setDeckTrim(deckId, v)}
                                trim={1.0} onVolumeChange={(v) => setDeckVolume(deckId, v)} 
                                onAuxLevelChange={(auxIdx, v) => setAuxLevel(deckId, auxIdx, v)}
                                onEqChange={(band, v) => setDeckEq(deckId, band, v)}
                                onToggleEq={() => toggleDeckEq(deckId)}
                                bitrate={decksBitrate[deckId]} assignment="THRU" onAssignmentChange={() => {}}
                                audioElement={getDeckElement(deckId)} analyser={getDeckAnalyser(deckId)} 
                            />
                        ))}
                    </div>

                    {/* SYSTEM RACK (Right Column) */}
                    <div className="flex flex-col gap-2 w-[140px] shrink-0 h-full overflow-hidden">
                        
                        {/* 1. Output & Master Section */}
                        <div className="flex-1 flex flex-col bg-[#0b111a] border border-slate-800 rounded overflow-hidden">
                            <div className="w-full text-center py-1 bg-[#162030] border-b border-slate-700 flex items-center justify-between px-2">
                                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">SYSTEM</span>
                                <Settings size={10} className="text-slate-500" />
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto custom-scrollbar">
                                
                                {/* REFRESH BUTTON */}
                                <button 
                                  onClick={refreshAllStreams}
                                  className="w-full bg-[#1e293b] hover:bg-[#2d3b4e] border border-slate-700 text-slate-300 hover:text-white rounded py-2 flex items-center justify-center gap-2 group transition-all mb-1 active:scale-95"
                                  title="Recargar todos los streams"
                                >
                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700 text-cyan-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">RELOAD ALL</span>
                                </button>

                                {/* DYNAMICS SECTION */}
                                <div className="bg-[#111a26] rounded border border-slate-800/50 p-2 mb-1">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1.5 text-center tracking-wider">DYNAMICS</span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={toggleCompressor}
                                            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded border transition-all ${isCompressorActive ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'bg-[#0f172a] border-slate-700 text-slate-600'}`}
                                        >
                                            <Activity size={10} className="mb-0.5" />
                                            <span className="text-[7px] font-black">COMP</span>
                                        </button>
                                        <button 
                                            onClick={toggleLimiter}
                                            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded border transition-all ${isLimiterActive ? 'bg-red-900/30 border-red-500 text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.3)]' : 'bg-[#0f172a] border-slate-700 text-slate-600'}`}
                                        >
                                            <ShieldAlert size={10} className="mb-0.5" />
                                            <span className="text-[7px] font-black">LIMIT</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-slate-800 w-full mb-1"></div>

                                {/* MASTER FADER BLOCK REDISEÑADO - REGLA EN MEDIO */}
                                <div className="flex flex-col bg-[#1e3a57] rounded border border-slate-800/50 p-2 flex-1 min-h-[180px]">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black text-white bg-red-600 px-1 rounded">MASTER</span>
                                        <select 
                                            onChange={(e) => setOutputDevice('MASTER', e.target.value)}
                                            className="w-[80px] bg-[#050910] text-[8px] text-cyan-500 border border-slate-700 rounded px-1 py-0.5 outline-none truncate"
                                        >
                                            <option value="">Default Out</option>
                                            {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    
                                    {/* CONTENEDOR FADER CON REGLA INTEGRADA */}
                                    <div ref={masterFaderContainerRef} className="flex-1 relative bg-[#050910] rounded border border-slate-800 shadow-inner overflow-hidden flex justify-center">
                                        
                                        {/* REGLA DE FONDO (Absoluta) */}
                                        <div className="absolute inset-y-8 inset-x-0 flex flex-col justify-between items-center z-0 pointer-events-none opacity-80">
                                            {/* Línea Central */}
                                            <div className="absolute top-0 bottom-0 w-[1px] bg-slate-700/50"></div>

                                            {/* Marcas dB (Calculadas aprox para fader lineal 0-1) */}
                                            {/* 0dB (1.0) -> Top */}
                                            {/* -6dB (0.5) -> Middle */}
                                            {/* -Inf (0.0) -> Bottom */}

                                            {[
                                              { db: '0', pos: '0%', main: true },
                                              { db: '-3', pos: '29%', main: false },
                                              { db: '-6', pos: '50%', main: true },
                                              { db: '-12', pos: '75%', main: false },
                                              { db: '-20', pos: '90%', main: true },
                                              { db: '∞', pos: '100%', main: true },
                                            ].map((mark) => (
                                                <div key={mark.db} className="absolute w-full flex items-center justify-center" style={{ top: mark.pos }}>
                                                    <div className={`w-full h-[1px] ${mark.main ? 'bg-slate-500' : 'bg-slate-700'}`}></div>
                                                    <span className={`absolute bg-[#050910] px-1 text-[8px] font-mono font-bold ${mark.db === '0' ? 'text-white' : 'text-slate-400'}`}>
                                                        {mark.db}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* FADER INPUT (Transparente encima) */}
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <input 
                                                type="range" min="0" max="1" step="0.005" 
                                                value={masterVol} 
                                                onChange={(e) => { const v = parseFloat(e.target.value); setMasterVol(v); setMasterVolume(v); }} 
                                                className="fader-master" 
                                                style={{ width: `${masterFaderHeight}px`, height: '60px' }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* AUX 1 BLOCK */}
                                <div className="flex flex-col bg-[#111a26] rounded border border-slate-800/50 p-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black text-white bg-green-600 px-1 rounded">AUX 1</span>
                                        <select 
                                            onChange={(e) => setOutputDevice('AUX1', e.target.value)}
                                            className="w-[80px] bg-[#050910] text-[8px] text-green-500 border border-slate-700 rounded px-1 py-0.5 outline-none truncate"
                                        >
                                            <option value="">Default Out</option>
                                            {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-center py-1">
                                         <Knob value={aux1Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux1Vol(v); setAuxMasterVolume(1, v); }} min={0} max={1.2} label="LEVEL" colorClass="bg-green-500" />
                                    </div>
                                </div>

                                {/* AUX 2 BLOCK */}
                                <div className="flex flex-col bg-[#111a26] rounded border border-slate-800/50 p-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black text-white bg-amber-600 px-1 rounded">AUX 2</span>
                                        <select 
                                            onChange={(e) => setOutputDevice('AUX2', e.target.value)}
                                            className="w-[80px] bg-[#050910] text-[8px] text-amber-500 border border-slate-700 rounded px-1 py-0.5 outline-none truncate"
                                        >
                                            <option value="">Default Out</option>
                                            {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-center py-1">
                                         <Knob value={aux2Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux2Vol(v); setAuxMasterVolume(2, v); }} min={0} max={1.2} label="LEVEL" colorClass="bg-amber-500" />
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
            {/* BOTTOM BAR CON TELEMETRÍA Y GRABADORAS (MASTER, AUX 1, AUX 2) */}
            <div className="w-full flex items-center justify-between bg-[#0a121d] px-4 py-2 border border-slate-800 rounded-lg shrink-0 shadow-2xl gap-4">
                
                {/* INFO IZQUIERDA: RELOJ Y TEMPERATURA */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-[#050910] px-3 py-1.5 rounded border border-slate-800">
                        <Clock size={16} className="text-cyan-500 animate-pulse" />
                        <span className="text-[18px] font-mono font-bold text-slate-100 tracking-[0.1em] leading-none">
                            {currentTime.toLocaleTimeString('es-ES')}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-[#050910] px-3 py-1.5 rounded border border-slate-800">
                        <Thermometer size={16} className="text-amber-500" />
                        <span className="text-[16px] font-mono font-bold text-amber-500 leading-none">
                            {weather.temp}
                        </span>
                    </div>
                </div>

                {/* CENTRO: GRABADORAS */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <div className="w-[150px]">
                        <Recorder 
                            state={recorders[0]} 
                            onStart={() => startRecording(0)} 
                            onStop={() => stopRecording(0)} 
                            onExport={() => exportRecording(0)} 
                            onFormatChange={(f) => setFormat(0, f)} 
                            onClear={() => clearRecorder(0)} 
                            analyser={getMasterAnalyser()} 
                        />
                    </div>
                    <div className="w-[150px]">
                        <Recorder 
                            state={recorders[1]} 
                            onStart={() => startRecording(1)} 
                            onStop={() => stopRecording(1)} 
                            onExport={() => exportRecording(1)} 
                            onFormatChange={(f) => setFormat(1, f)} 
                            onClear={() => clearRecorder(1)} 
                            analyser={getAuxAnalyser()} 
                        />
                    </div>
                    <div className="w-[150px]">
                        <Recorder 
                            state={recorders[2]} 
                            onStart={() => startRecording(2)} 
                            onStop={() => stopRecording(2)} 
                            onExport={() => exportRecording(2)} 
                            onFormatChange={(f) => setFormat(2, f)} 
                            onClear={() => clearRecorder(2)} 
                            analyser={getAux2Analyser()}
                            onScheduleChange={(start, end) => setSchedule(2, start, end)}
                        />
                    </div>
                </div>

                {/* DERECHA: ESTACIÓN ACTIVA */}
                <div className="flex items-center gap-3 bg-[#050910] px-4 py-2 rounded border border-slate-800 min-w-[150px] justify-center">
                    <Wifi size={16} className={activeStation ? 'text-cyan-400 animate-pulse' : 'text-slate-700'} />
                    <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest truncate max-w-[200px]">
                        {activeStation ? activeStation.name : 'SILENT'}
                    </span>
                </div>
            </div>
        </div>
        <div className="w-full shrink-0 z-40 bg-black mt-auto"><NewsTickerComponent news={news} loading={newsLoading} label="ÚLTIMA HORA ALICANTE" /></div>
      </main>
    </div>
  );
}
