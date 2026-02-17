
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Deck } from './components/Deck';
import { Visualizer } from './components/Visualizer';
import { Recorder } from './components/Recorder';
import { useAudioMixer } from './hooks/useAudioMixer';
import { fetchAlicanteNews, fetchAlicanteWeather, NewsItem, WeatherData } from './services/geminiService';
import { Zap, ShieldAlert, RefreshCw, Thermometer, Radio, Clock, Volume2, Maximize, Minimize, Wifi, Settings } from 'lucide-react';
import { DeckId } from './types';
import { NewsTicker as NewsTickerComponent } from './components/NewsTicker';
import { Knob } from './components/Knob';

export default function App() {
  const mixer = useAudioMixer();

  // Desestructuración con valores por defecto para evitar errores si el hook falla
  const { 
    togglePlay = () => {}, 
    stopTrack = () => {}, 
    setDeckTrim = () => {}, 
    setDeckVolume = () => {}, 
    setMasterVolume = () => {}, 
    setDeckEq = () => {}, 
    toggleDeckEq = () => {},
    getMasterAnalyser = () => null, 
    getAuxAnalyser = () => null, 
    getAux2Analyser = () => null, 
    getDeckAnalyser = () => null, 
    getDeckElement = () => null,
    setupLiveMic = () => {}, 
    allDeckIds = [], 
    decksBitrate = {}, 
    activeStation = null,
    recorders = [], 
    startRecording = () => {}, 
    stopRecording = () => {}, 
    clearRecorder = () => {}, 
    exportRecording = () => {}, 
    setFormat = () => {},
    changeStream = () => {}, 
    setAuxLevel = () => {},
    outputDevices = [], 
    setOutputDevice = () => {}, 
    setAuxMasterVolume = () => {},
    isAnyPlaying = false
  } = mixer || {};

  const [masterVol, setMasterVol] = useState(0.8);
  const [aux1Vol, setAux1Vol] = useState(1.0);
  const [aux2Vol, setAux2Vol] = useState(1.0);
  
  const [isOnAir, setIsOnAir] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: "--°C", condition: "Sincronizando..." });
  const [engineReady, setEngineReady] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

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

  useEffect(() => {
    setIsOnAir(engineReady && isAnyPlaying && masterVol > 0.05);
  }, [engineReady, isAnyPlaying, masterVol]);

  const loadData = useCallback(async () => {
    setNewsLoading(true);
    try {
      const [aNews, aWeather] = await Promise.all([ 
        fetchAlicanteNews().catch(() => []), 
        fetchAlicanteWeather().catch(() => ({ temp: "--°C", condition: "Error" })) 
      ]);
      setNews(aNews); setWeather(aWeather);
    } catch (e) { 
      console.warn("Error cargando datos de Gemini:", e); 
    } finally { 
      setNewsLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (engineReady) {
      loadData();
      const interval = setInterval(loadData, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [engineReady, loadData]);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const handleStartEngine = () => { 
    setMasterVolume(masterVol); 
    setEngineReady(true); 
  };

  if (!mixer) {
    return (
      <div className="fixed inset-0 bg-[#0b111a] flex items-center justify-center text-red-500 font-bold">
        ERROR CRÍTICO: No se pudo inicializar el motor de audio.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b111a] text-slate-300 font-sans overflow-hidden h-full w-full">
      {!engineReady && (
        <div className="fixed inset-0 z-[100] bg-[#0b111a] flex flex-col items-center justify-center p-6 text-center">
            <Radio size={80} className="text-cyan-500 mb-8 animate-pulse" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">REVOX-MIX DIGITAL PRO</h1>
            <p className="text-slate-400 mb-8 max-w-md">Unidad de mezcla profesional optimizada para emisiones en directo y gestión de streams.</p>
            <button 
              onClick={handleStartEngine} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-16 py-5 rounded-full font-black text-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] transition-all active:scale-95"
            >
              ACTIVAR ESTUDIO
            </button>
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
                                onMicSelect={(deviceId) => setupLiveMic(deviceId)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 w-[140px] shrink-0 h-full overflow-hidden">
                        <div className="flex-1 flex flex-col bg-[#0b111a] border border-slate-800 rounded overflow-hidden">
                            <div className="w-full text-center py-1 bg-[#162030] border-b border-slate-700"><span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">OUTPUT MATRIX</span></div>
                            
                            <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col bg-[#111a26] rounded border border-slate-800/50 p-2 flex-1 min-h-[180px]">
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
                                    
                                    <div ref={masterFaderContainerRef} className="flex-1 relative bg-[#050910] rounded border border-slate-800 shadow-inner overflow-hidden flex justify-center">
                                        <div className="absolute inset-y-8 inset-x-0 flex flex-col justify-between items-center z-0 pointer-events-none opacity-80">
                                            <div className="absolute top-0 bottom-0 w-[1px] bg-slate-700/50"></div>
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
            
            <div className="w-full flex items-center justify-between bg-[#0a121d] px-4 py-2 border border-slate-800 rounded-lg shrink-0 shadow-2xl gap-4">
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

                <div className="flex items-center gap-2 flex-1 justify-center">
                    {recorders && recorders.length > 0 && recorders.map((rec, idx) => (
                      <div key={idx} className="w-[150px]">
                          <Recorder 
                              state={rec} 
                              onStart={() => startRecording(idx)} 
                              onStop={() => stopRecording(idx)} 
                              onExport={() => exportRecording(idx)} 
                              onFormatChange={(f) => setFormat(idx, f)} 
                              onClear={() => clearRecorder(idx)} 
                              analyser={idx === 0 ? getMasterAnalyser() : idx === 1 ? getAuxAnalyser() : getAux2Analyser()} 
                          />
                      </div>
                    ))}
                </div>

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
