
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Deck } from './components/Deck';
import { Visualizer } from './components/Visualizer';
import { Recorder } from './components/Recorder';
import { useAudioMixer } from './hooks/useAudioMixer';
import { fetchAlicanteNews, fetchAlicanteWeather, NewsItem, WeatherData } from './services/geminiService';
import { Radio, Clock, Thermometer, Wifi, AudioLines } from 'lucide-react';
import { NewsTicker as NewsTickerComponent } from './components/NewsTicker';
import { Knob } from './components/Knob';

export default function App() {
  const mixer = useAudioMixer();

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
                setMasterFaderHeight(Math.max(100, entry.contentRect.height));
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
    <div className="flex flex-col bg-[#0b111a] text-slate-300 h-screen w-screen overflow-hidden">
      {!engineReady && (
        <div className="fixed inset-0 z-[100] bg-[#0b111a] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Radio size={80} className="text-cyan-500 mb-8 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">REVOX-MIX DIGITAL PRO</h1>
            <p className="text-slate-400 mb-8 max-w-md text-sm md:text-base">Unidad de mezcla profesional auto-ajustable optimizada para Alicante Broadcast.</p>
            <button 
              onClick={handleStartEngine} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-12 md:px-16 py-4 md:py-5 rounded-full font-black text-lg md:text-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] transition-all active:scale-95"
            >
              ACTIVAR ESTUDIO
            </button>
        </div>
      )}

      {/* HEADER SECTION (Altura fija de 80px) */}
      <header className="h-[80px] flex shrink-0 items-center bg-[#050910] border-b border-slate-800 shadow-xl z-50">
          <div className="w-[120px] md:w-[200px] flex flex-col items-center justify-center border-r border-slate-800/60 h-full bg-[#080c14]">
              <div className={`rounded-sm border-2 font-black transition-all px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm ${isOnAir ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-[#0f0f0f] border-slate-900 text-slate-800'}`}>ON AIR</div>
          </div>
          <div className="flex-1 h-full px-2 md:px-4 overflow-hidden"><Visualizer analyser={getMasterAnalyser()} /></div>
          <div className="w-[120px] md:w-[200px] flex flex-col items-center justify-center border-l border-slate-800/60 h-full bg-[#080c14]">
            <span className="text-[14px] md:text-[16px] font-black text-slate-100 tracking-[0.2em] md:tracking-[0.3em] uppercase italic">REVOX<span className="text-cyan-500">MIX</span></span>
          </div>
      </header>

      {/* MIXER BOARD (Cuerpo dinámico) */}
      <main className="flex-1 flex min-h-0 bg-[#0d141f] p-1 md:p-2 gap-1 md:gap-2 overflow-hidden">
          {/* Deck Container: Scroll horizontal fluido */}
          <div className="flex-1 flex gap-[2px] bg-[#050910] p-[2px] rounded-lg border border-slate-800 shadow-inner h-full overflow-x-auto custom-scrollbar">
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

          {/* Master Matrix (Ancho fijo responsivo) */}
          <aside className="w-[120px] md:w-[150px] flex flex-col gap-1 md:gap-2 h-full overflow-hidden shrink-0">
              <div className="flex-1 flex flex-col bg-[#0b111a] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
                  <div className="w-full text-center py-1.5 bg-[#162030] border-b border-slate-700">
                    <span className="text-[9px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest">MASTER OUTPUT</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1 md:gap-2 p-1.5 md:p-2 overflow-y-auto custom-scrollbar">
                      {/* Master Fader Unit */}
                      <div className="flex-col bg-[#050910] rounded border border-slate-800/50 p-2 flex-1 flex min-h-[160px]">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[8px] md:text-[9px] font-black text-white bg-red-600 px-1 rounded">MSTR</span>
                              <select 
                                  onChange={(e) => setOutputDevice('MASTER', e.target.value)}
                                  className="w-[50px] md:w-[80px] bg-[#0a121d] text-[7px] md:text-[8px] text-cyan-500 border border-slate-700 rounded px-1 py-0.5 outline-none truncate"
                              >
                                  <option value="">Default</option>
                                  {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                              </select>
                          </div>
                          
                          <div ref={masterFaderContainerRef} className="flex-1 relative bg-[#020617] rounded border border-slate-800/50 shadow-inner overflow-hidden flex justify-center">
                              <div className="absolute inset-y-8 inset-x-0 flex flex-col justify-between items-center z-0 pointer-events-none opacity-40">
                                  {[0, 29, 50, 75, 90, 100].map(pos => (
                                      <div key={pos} className="absolute w-full h-[1px] bg-slate-700" style={{ top: `${pos}%` }}></div>
                                  ))}
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <input 
                                      type="range" min="0" max="1" step="0.005" 
                                      value={masterVol} 
                                      onChange={(e) => { const v = parseFloat(e.target.value); setMasterVol(v); setMasterVolume(v); }} 
                                      className="fader-master" 
                                      style={{ width: `${masterFaderHeight}px`, height: '50px' }} 
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Aux Master Knobs */}
                      <div className="flex flex-col bg-[#111a26] rounded border border-slate-800/50 p-1.5">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-black text-white bg-green-600 px-1 rounded">AUX 1</span>
                          </div>
                          <div className="flex justify-center py-1">
                               <Knob value={aux1Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux1Vol(v); setAuxMasterVolume(1, v); }} min={0} max={1.2} label="LVL" colorClass="bg-green-500" sizeClass="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                      </div>

                      <div className="flex flex-col bg-[#111a26] rounded border border-slate-800/50 p-1.5">
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-black text-white bg-amber-600 px-1 rounded">AUX 2</span>
                          </div>
                          <div className="flex justify-center py-1">
                               <Knob value={aux2Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux2Vol(v); setAuxMasterVolume(2, v); }} min={0} max={1.2} label="LVL" colorClass="bg-amber-500" sizeClass="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                      </div>
                  </div>
              </div>
          </aside>
      </main>

      {/* FOOTER SECTION (Altura fija de 60px) */}
      <footer className="h-[60px] md:h-[70px] w-full flex items-center justify-between bg-[#0a121d] px-3 md:px-6 border-t border-slate-800 shrink-0 z-50">
          <div className="flex items-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 bg-[#050910] px-2 md:px-3 py-1.5 rounded border border-slate-800">
                  <Clock size={14} className="text-cyan-500 animate-pulse" />
                  <span className="text-[14px] md:text-[18px] font-mono font-bold text-slate-100 tracking-[0.1em] leading-none">
                      {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 bg-[#050910] px-2 md:px-3 py-1.5 rounded border border-slate-800">
                  <Thermometer size={14} className="text-amber-500" />
                  <span className="text-[12px] md:text-[16px] font-mono font-bold text-amber-500 leading-none">
                      {weather.temp}
                  </span>
              </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-center max-w-[50%] overflow-hidden">
              {recorders && recorders.length > 0 && recorders.slice(0, 2).map((rec, idx) => (
                <div key={idx} className="w-[100px] md:w-[140px] shrink-0">
                    <Recorder 
                        state={rec} 
                        onStart={() => startRecording(idx)} 
                        onStop={() => stopRecording(idx)} 
                        onExport={() => exportRecording(idx)} 
                        onFormatChange={(f) => setFormat(idx, f)} 
                        onClear={() => clearRecorder(idx)} 
                        analyser={idx === 0 ? getMasterAnalyser() : getAuxAnalyser()} 
                    />
                </div>
              ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3 bg-[#050910] px-3 md:px-4 py-1.5 md:py-2 rounded border border-slate-800 min-w-[100px] md:min-w-[150px] justify-center">
              <AudioLines size={14} className={activeStation ? 'text-cyan-400' : 'text-slate-700'} />
              <span className="text-[8px] md:text-[10px] font-black text-slate-100 uppercase tracking-widest truncate max-w-[80px] md:max-w-[200px]">
                  {activeStation ? activeStation.name : 'STUDIO'}
              </span>
          </div>
      </footer>

      {/* TICKER (Banda inferior de 24px) */}
      <div className="h-[24px] md:h-[30px] w-full shrink-0 z-40 bg-black mt-auto overflow-hidden">
        <NewsTickerComponent news={news} loading={newsLoading} label="ÚLTIMA HORA ALICANTE" />
      </div>
    </div>
  );
}
