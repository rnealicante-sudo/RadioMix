
import React, { useState, useEffect, useCallback } from 'react';
import { Deck } from './components/Deck';
import { Visualizer } from './components/Visualizer';
import { MiniVisualizer } from './components/MiniVisualizer';
import { AnalogMeter } from './components/AnalogMeter';
import { NewsTicker } from './components/NewsTicker';
import { Recorder } from './components/Recorder';
import { useAudioMixer } from './hooks/useAudioMixer';
import { fetchAlicanteNews, fetchAlicanteWeather, NewsItem, WeatherData } from './services/geminiService';
import { Zap, ShieldAlert, RefreshCw, Thermometer, Radio, Clock, Volume2, Maximize, Minimize } from 'lucide-react';
import { DeckId } from './types';

export default function App() {
  const { 
    togglePlay, stopTrack, setDeckTrim, setDeckVolume, setMasterVolume,
    getMasterAnalyser, getAuxAnalyser, getAux2Analyser, getDeckAnalyser, getDeckElement,
    setupLiveMic, allDeckIds,
    isLimiterActive, toggleLimiter, isCompressorActive, toggleCompressor, 
    recorders, startRecording, stopRecording, clearRecorder, exportRecording, setSchedule, setFormat,
    changeStream, toggleAux1, toggleAux2
  } = useAudioMixer();

  const [masterVol, setMasterVol] = useState(0.8); 
  const [meterType, setMeterType] = useState<'DIGITAL' | 'ANALOG'>('DIGITAL');
  const [isOnAir, setIsOnAir] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: "--°C", condition: "Sincronizando..." });
  const [engineReady, setEngineReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estados para reactividad de auxiliares
  const [aux1ActiveDecks, setAux1ActiveDecks] = useState<Partial<Record<DeckId, boolean>>>({});
  const [aux2ActiveDecks, setAux2ActiveDecks] = useState<Partial<Record<DeckId, boolean>>>({});

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setNewsLoading(true);
    try {
      const [aNews, aWeather] = await Promise.all([
        fetchAlicanteNews(),
        fetchAlicanteWeather()
      ]);
      setNews(aNews);
      setWeather(aWeather);
    } catch (e) { console.error(e); }
    finally { setNewsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30 * 60 * 1000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
        clearInterval(interval);
        clearInterval(clockInterval);
        document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [loadData]);

  useEffect(() => {
    const analyser = getMasterAnalyser();
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const checkVolume = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      setIsOnAir(Math.sqrt(sum / dataArray.length) > 0.005);
    };
    const interval = setInterval(checkVolume, 200);
    return () => clearInterval(interval);
  }, [getMasterAnalyser]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen();
    }
  };

  const handleStartEngine = () => {
    setMasterVolume(masterVol);
    setEngineReady(true);
  };

  const handleToggleAux1 = (deckId: DeckId) => {
    const isActive = toggleAux1(deckId);
    setAux1ActiveDecks(prev => ({ ...prev, [deckId]: isActive }));
  };

  const handleToggleAux2 = (deckId: DeckId) => {
    const isActive = toggleAux2(deckId);
    setAux2ActiveDecks(prev => ({ ...prev, [deckId]: isActive }));
  };

  const formatClock = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b111a] text-slate-300 font-sans overflow-hidden h-full w-full">
      
      {!engineReady && (
        <div className="fixed inset-0 z-[100] bg-[#0b111a] flex flex-col items-center justify-center p-6 text-center">
            <Radio size={80} className="text-cyan-500 mb-8 animate-pulse" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">REVOX-MIX DIGITAL PRO</h1>
            <p className="text-slate-400 text-base max-w-lg mb-10 leading-relaxed">Consola de mezcla profesional para estaciones de radio. Optimizada para pantalla completa y baja latencia.</p>
            <button 
                onClick={handleStartEngine}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-16 py-5 rounded-full font-black text-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] transition-all active:scale-95 flex items-center gap-4"
            >
                <Volume2 size={28} />
                ACTIVAR ESTUDIO
            </button>
            <div className="mt-12 flex gap-8 items-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                <span>Alicante HQ</span>
                <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                <span>DSP v6.8 Stable</span>
                <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                <span>Real-Time Engine</span>
            </div>
        </div>
      )}

      {/* ÁREA DE MEZCLA EXPANDIDA */}
      <main className={`flex-1 flex flex-col bg-[#0d141f] w-full h-full relative overflow-hidden ${isFullscreen ? 'p-0' : ''}`}>
        
        {/* CONSOLA DE ANCHO COMPLETO */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? '' : 'p-2 gap-2'}`}>
            
            <div className={`flex-1 flex flex-col bg-[#1c3550] w-full shadow-2xl border-slate-700 overflow-hidden ${isFullscreen ? 'rounded-none border-0' : 'rounded-lg border'}`}>
                
                {/* PUENTE DE MONITORIZACIÓN */}
                <div className={`flex items-center bg-[#050910] border-b border-slate-800 shadow-lg w-full shrink-0 ${isFullscreen ? 'h-[60px]' : 'h-[80px]'}`}>
                    <div className={`${isFullscreen ? 'w-[120px]' : 'w-[200px]'} flex flex-col items-center justify-center border-r border-slate-800/60 h-full bg-[#080c14]`}>
                        <div className={`rounded-sm border-2 font-black transition-all duration-300 tracking-[0.2em] ${
                          isFullscreen ? 'px-3 py-1 text-[11px]' : 'px-8 py-2.5 text-[16px]'
                        } ${
                          isOnAir 
                            ? 'bg-red-600 border-red-400 text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-105 active-glow' 
                            : 'bg-[#0f0f0f] border-slate-900 text-slate-800 shadow-none scale-100'
                        }`}>
                          ON AIR
                        </div>
                    </div>

                    <div className="flex-1 h-full px-4 overflow-hidden">
                        <Visualizer analyser={getMasterAnalyser()} />
                    </div>

                    <div className={`${isFullscreen ? 'w-[120px]' : 'w-[200px]'} flex flex-col items-center justify-center border-l border-slate-800/60 h-full bg-[#080c14]`}>
                        <div className="flex flex-col items-center">
                            <span className={`${isFullscreen ? 'text-[11px]' : 'text-[16px]'} font-black text-slate-100 tracking-[0.3em] uppercase italic`}>REVOX<span className="text-cyan-500">MIX</span></span>
                            {!isFullscreen && <span className="text-[8px] font-bold text-slate-600 tracking-[0.4em] uppercase mt-1">Digital Audio Processor</span>}
                        </div>
                    </div>
                </div>

                {/* CUERPO DE LA MESA */}
                <div className={`flex flex-1 w-full bg-[#16293d] overflow-hidden ${isFullscreen ? 'p-0' : 'p-2 gap-2'}`}>
                    <div className="flex flex-1 gap-[2px] bg-[#0f172a] p-[2px] rounded border border-slate-800 shadow-inner h-full overflow-x-auto custom-scrollbar">
                        {allDeckIds.map((deckId) => (
                            <Deck 
                                key={deckId} id={deckId}
                                isFullscreen={isFullscreen}
                                onLoad={() => {}} onTogglePlay={() => togglePlay(deckId)} onStop={() => stopTrack(deckId)}
                                onStreamChange={(url) => changeStream(deckId, url)} onTrimChange={(v) => setDeckTrim(deckId, v)}
                                trim={1.0} onVolumeChange={(v) => setDeckVolume(deckId, v)} assignment="THRU" onAssignmentChange={() => {}}
                                audioElement={getDeckElement(deckId)} analyser={getDeckAnalyser(deckId)} 
                                aux1Active={!!aux1ActiveDecks[deckId]} onToggleAux1={() => handleToggleAux1(deckId)} 
                                aux2Active={!!aux2ActiveDecks[deckId]} onToggleAux2={() => handleToggleAux2(deckId)}
                                onMicSelect={(deviceId) => setupLiveMic(deviceId)}
                            />
                        ))}
                    </div>

                    <div className={`flex flex-col items-center bg-[#1e2a3b] border border-[#3c1c1c] rounded h-full overflow-hidden shrink-0 ${isFullscreen ? 'w-[100px]' : 'w-[125px]'}`}>
                        <div className="w-full text-center py-2 bg-[#2d1212] border-b border-[#4d1a1a] mb-1">
                            {!isFullscreen && <div className="text-[8px] font-bold text-red-400 uppercase tracking-widest opacity-60">MASTER</div>}
                            <div className="text-[10px] font-black tracking-tighter text-red-500 uppercase">RECORDER</div>
                        </div>
                        <div className="flex-1 w-full flex flex-col gap-2 overflow-y-auto px-1.5 pb-2 custom-scrollbar">
                            {recorders.map((rec, idx) => (
                                <Recorder 
                                    key={idx} state={rec} onStart={() => startRecording(idx)} onStop={() => stopRecording(idx)} 
                                    onExport={() => exportRecording(idx)} onFormatChange={(f) => setFormat(idx, f)}
                                    onClear={() => clearRecorder(idx)} analyser={idx === 0 ? getMasterAnalyser() : (idx === 1 ? getAuxAnalyser() : getAux2Analyser())}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={`flex gap-[2px] bg-[#112233] p-[2px] rounded border border-slate-700 shadow-inner h-full shrink-0`}>
                        <div className={`flex flex-col items-center bg-[#193048] border border-slate-800 rounded relative h-full ${isFullscreen ? 'w-[100px]' : 'w-[130px]'}`}>
                             <div className="w-full bg-[#0f172a] border-b border-slate-700 py-2 text-center shadow-md">
                                <span className={`${isFullscreen ? 'text-[9px]' : 'text-[11px]'} font-black text-cyan-500 tracking-[0.2em] uppercase`}>Master Bus</span>
                             </div>
                             <div className="w-full flex justify-center py-4 bg-[#152535] border-b border-slate-700">
                                 <button onClick={() => setMasterVolume(masterVol > 0 ? 0 : masterVol)} className={`w-12 h-12 text-[12px] font-black border-2 rounded-sm transition-all duration-300 ${masterVol > 0 ? 'bg-[#ef4444] border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)]' : 'bg-[#1e293b] border-slate-700 text-slate-600'}`}>ON</button>
                             </div>
                             <div className="w-full grid grid-cols-1 gap-1.5 p-2 bg-[#0f1c2b] border-b border-slate-800">
                                 <button onClick={toggleLimiter} className={`flex items-center justify-between px-3 py-2 rounded text-[9px] font-black border transition-all ${isLimiterActive ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                    <span className="hidden sm:inline">LIMITER</span><ShieldAlert size={12} className={isLimiterActive ? 'animate-pulse' : ''} />
                                 </button>
                                 <button onClick={toggleCompressor} className={`flex items-center justify-between px-3 py-2 rounded text-[9px] font-black border transition-all ${isCompressorActive ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                    <span className="hidden sm:inline">COMPRESS</span><Zap size={12} className={isCompressorActive ? 'animate-pulse' : ''} />
                                 </button>
                             </div>
                             <div className="flex-1 w-full relative flex items-center justify-center bg-[#152535]">
                                <input type="range" min="0" max="1" step="0.005" value={masterVol} onChange={(e) => { const v = parseFloat(e.target.value); setMasterVol(v); setMasterVolume(v); }} className="fader-vertical" />
                             </div>
                        </div>

                        <div className={`${isFullscreen ? 'w-[80px]' : 'w-[100px]'} h-full bg-[#050910] border border-slate-700 rounded flex flex-col p-2`}>
                            <div className="w-full h-[50px] flex flex-col items-center justify-center border-b border-slate-800 mb-2">
                                 <div className={`toggle-switch scale-[0.8] ${meterType === 'ANALOG' ? 'down' : 'up'}`} onClick={() => setMeterType(prev => prev === 'DIGITAL' ? 'ANALOG' : 'DIGITAL')}>
                                    <div className="toggle-handle"></div>
                                 </div>
                            </div>
                            <div className="flex-1 w-full relative bg-black rounded border border-slate-800 overflow-hidden shadow-inner flex justify-center gap-[6px] p-2">
                                {meterType === 'DIGITAL' ? (
                                  <>
                                    <MiniVisualizer analyser={getMasterAnalyser()} width={isFullscreen ? 18 : 22} height={400} segmentCount={80} />
                                    <MiniVisualizer analyser={getMasterAnalyser()} width={isFullscreen ? 18 : 22} height={400} segmentCount={80} />
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-4">
                                    <AnalogMeter analyser={getMasterAnalyser()} width={isFullscreen ? 65 : 85} height={60} />
                                    <AnalogMeter analyser={getMasterAnalyser()} width={isFullscreen ? 65 : 85} height={60} />
                                  </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE TELEMETRÍA */}
            <div className={`w-full flex items-center justify-between bg-[#0a121d] border-x border-slate-800 shadow-2xl shrink-0 transition-all ${isFullscreen ? 'px-4 py-2 border-b-0' : 'px-10 py-4 border-b rounded-b-lg'}`}>
                <div className="flex items-center gap-8 md:gap-12">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Clock size={isFullscreen ? 14 : 20} className="text-cyan-500 animate-pulse" />
                        <div className="flex flex-col">
                            <span className={`${isFullscreen ? 'text-[16px]' : 'text-[24px]'} font-mono font-bold text-slate-100 leading-none tracking-[0.1em]`}>{formatClock(currentTime)}</span>
                            {!isFullscreen && <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Master Studio Time</span>}
                        </div>
                    </div>
                    {!isFullscreen && <div className="h-10 w-[1px] bg-slate-800/50 hidden md:block"></div>}
                    <div className="flex items-center gap-3 md:gap-4">
                        <Thermometer size={isFullscreen ? 14 : 20} className="text-amber-500" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className={`${isFullscreen ? 'text-[14px]' : 'text-[22px]'} font-mono font-bold text-amber-500 leading-none`}>{weather.temp}</span>
                                <span className={`${isFullscreen ? 'text-[9px]' : 'text-[12px]'} font-bold text-slate-300 uppercase tracking-tight hidden sm:inline`}>{weather.condition}</span>
                            </div>
                            {!isFullscreen && <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Alicante Broadcast Location</span>}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 md:gap-6">
                    <button 
                        onClick={toggleFullscreen}
                        className={`flex items-center gap-2 md:gap-3 rounded-full bg-[#1c3550] border border-slate-700 text-slate-300 hover:bg-cyan-900/40 hover:text-white transition-all group shadow-lg ${isFullscreen ? 'px-3 py-1.5' : 'px-5 py-2.5'}`}
                    >
                        {isFullscreen ? <Minimize size={14} /> : <Maximize size={18} />}
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">{isFullscreen ? 'Salir' : 'Fullscreen'}</span>
                    </button>
                    {!isFullscreen && (
                      <button onClick={loadData} className="p-2 md:p-3 rounded-full bg-slate-800/30 hover:bg-cyan-900/30 text-slate-500 hover:text-cyan-500 transition-all border border-transparent hover:border-cyan-800/50 shadow-md">
                        <RefreshCw size={18} className={newsLoading ? 'animate-spin' : ''} />
                      </button>
                    )}
                </div>
            </div>
        </div>

        {/* NOTICIAS INFERIORES */}
        <div className="w-full shrink-0 z-40 bg-black mt-auto">
          <NewsTicker news={news} loading={newsLoading} label="ÚLTIMA HORA ALICANTE" variant="amber" />
        </div>
      </main>

      {/* BARRA DE ESTADO TÉCNICO (Oculta en Fullscreen) */}
      {!isFullscreen && (
        <footer className="bg-[#0a111a] border-t border-slate-800 py-3 px-8 flex justify-between items-center z-50 shrink-0 hidden md:flex">
            <div className="flex items-center gap-3">
                <div className="flex gap-1 items-center bg-green-950/30 px-3 py-1 rounded-full border border-green-900/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">System Online</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] ml-4">Audio Buffer: 20ms</span>
            </div>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.3em]">ReVoxMix Professional v6.8 - Alicante Broadcast Unit</span>
            <div className="flex items-center gap-6">
               <span className="text-[10px] font-black text-cyan-900 uppercase tracking-widest">Full Screen Immersive Engine</span>
               <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-3 h-1 bg-cyan-950 rounded-full"></div>)}
               </div>
            </div>
        </footer>
      )}

      <style>{`
        .active-glow { animation: pulse-red 2.5s infinite; }
        @keyframes pulse-red {
            0% { box-shadow: 0 0 10px rgba(220,38,38,0.4); }
            50% { box-shadow: 0 0 40px rgba(220,38,38,0.9); }
            100% { box-shadow: 0 0 10px rgba(220,38,38,0.4); }
        }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a57; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0d141f; }
      `}</style>
    </div>
  );
}
