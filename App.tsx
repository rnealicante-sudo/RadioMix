
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Deck } from './components/Deck';
import { Visualizer } from './components/Visualizer';
import { Recorder } from './components/Recorder';
import { useAudioMixer } from './hooks/useAudioMixer';
import { fetchAlicanteNews, fetchAlicanteWeather, NewsItem, WeatherData } from './services/geminiService';
import { RefreshCw, Thermometer, Radio, Clock, Wifi, Settings, Activity, ShieldAlert, Speaker, Power } from 'lucide-react';
import { NewsTicker as NewsTickerComponent } from './components/NewsTicker';
import { Knob } from './components/Knob';

export default function App() {
  const { 
    togglePlay, stopTrack, setDeckTrim, setDeckVolume, setMasterVolume,
    getMasterAnalyser, getAuxAnalyser, getAux2Analyser, getDeckAnalyser, getDeckElement,
    allDeckIds, decksBitrate,
    isLimiterActive, toggleLimiter, isCompressorActive, toggleCompressor, 
    recorders, startRecording, stopRecording, clearRecorder, setFormat, exportRecording,
    changeStream, setAuxLevel, setAuxMasterVolume, refreshAllStreams, isAnyPlaying,
    outputDevices, setOutputDevice, hwEnabled, toggleHardwareOutput, refreshDevices
  } = useAudioMixer();

  const [masterVol, setMasterVol] = useState(0.8);
  const [aux1Vol, setAux1Vol] = useState(1.0);
  const [aux2Vol, setAux2Vol] = useState(1.0);
  
  const [isOnAir, setIsOnAir] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({ temp: "--°C", condition: "Actualizando..." });
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
        fetchAlicanteWeather().catch(() => ({ temp: "--°C", condition: "Alicante" }))
      ]);
      if (aNews.length > 0) setNews(aNews);
      setWeather(aWeather);
    } catch (e) { 
      console.error("Data Load Error:", e);
    } finally { 
      setNewsLoading(false); 
    }
  }, []);

  // Carga inicial y refresco cada 30 min
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
    refreshDevices();
  };

  const currentBitrate = (() => {
    if (!allDeckIds) return 0;
    for (const id of allDeckIds) {
      const el = getDeckElement(id);
      if (el && !el.paused) return decksBitrate[id] || 0;
    }
    return 0;
  })();

  return (
    <div className="flex flex-col bg-[#0b111a] text-slate-300 font-sans overflow-hidden h-screen w-full select-none">
      {!engineReady && (
        <div className="fixed inset-0 z-[100] bg-[#0b111a] flex flex-col items-center justify-center p-6 text-center">
            <Radio size={80} className="text-cyan-500 mb-8 animate-pulse" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">REVOX-MIX DIGITAL PRO</h1>
            <p className="text-slate-500 mb-8 max-w-sm uppercase text-[10px] tracking-widest font-bold">Initialize the 64-bit real-time broadcasting engine</p>
            <button onClick={handleStartEngine} className="bg-cyan-600 hover:bg-cyan-500 text-white px-16 py-5 rounded-full font-black text-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] transition-all transform active:scale-95">START STUDIO</button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-center bg-[#050910] border-b border-slate-800 shadow-lg w-full h-[65px] shrink-0">
          <div className="w-[160px] flex items-center justify-center border-r border-slate-800/60 h-full bg-[#080c14]">
              <span className="text-[14px] font-black text-slate-100 tracking-[0.2em] uppercase italic">REVOX<span className="text-cyan-500">MIX</span></span>
          </div>
          <div className="flex-1 h-full px-4 overflow-hidden flex items-center gap-4">
              <div className="flex-1 h-full">
                <Visualizer analyser={getMasterAnalyser()} />
              </div>
              <div className="flex flex-col items-center justify-center pr-4 border-l border-slate-800/40 pl-4 h-2/3 shrink-0">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Bitrate</span>
                  <div className="flex items-baseline gap-1">
                      <span className={`text-[18px] font-mono font-black ${currentBitrate > 0 ? 'text-cyan-400' : 'text-slate-700'}`}>
                          {currentBitrate || '---'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-500">kbps</span>
                  </div>
              </div>
          </div>
          <div className="w-[140px] flex flex-col items-center justify-center border-l border-slate-800/60 h-full bg-[#080c14]">
              <div className="flex items-center gap-2">
                  <Wifi size={14} className={isOnAir ? "text-cyan-500 animate-pulse" : "text-slate-700"} />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Master-Sync</span>
              </div>
          </div>
      </div>

      {/* MAIN CONSOLE BODY */}
      <div className="flex-1 flex overflow-hidden bg-[#0d141f] p-1 gap-1">
          
          {/* LEFT COLUMN: MASTER TELEMETRY & RECORDERS */}
          <div className="w-[160px] flex flex-col gap-1 shrink-0 h-full overflow-hidden">
              <div className="flex-1 flex flex-col bg-[#0b111a] border border-slate-800 rounded-sm overflow-hidden shadow-2xl">
                  <div className="w-full text-center py-1.5 bg-[#162030] border-b border-slate-700">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em]">Broadcast Unit</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-1.5 overflow-hidden flex-1">
                      <div className={`rounded-sm border-2 font-black transition-all py-3 flex flex-col items-center justify-center mb-1 ${isOnAir ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-[#0f0f0f] border-slate-900 text-slate-800'}`}>
                          <span className="text-xs tracking-widest">ON AIR</span>
                      </div>

                      <div className="bg-[#050910] border border-slate-800 rounded p-2 mb-1 flex flex-col items-center justify-center gap-1.5">
                          <div className="flex items-center gap-2">
                              <Clock size={16} className="text-cyan-500" />
                              <span className="text-[16px] font-mono font-bold text-slate-100 tracking-wider">
                                  {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                          </div>
                          <div className="flex items-center gap-2 border-t border-slate-800 w-full mt-1.5 pt-1.5 justify-center">
                              <Thermometer size={14} className="text-amber-500" />
                              <span className="text-[12px] font-mono font-bold text-amber-500">{weather.temp}</span>
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                          {recorders.map((rec, idx) => (
                            <div key={idx} className="flex-1 min-h-[95px]">
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
                  </div>
              </div>
          </div>

          {/* CENTER: CHANNEL RACK */}
          <div className="flex-1 flex gap-[1px] bg-[#050910] p-[1px] rounded-sm border border-slate-800 shadow-inner h-full overflow-x-auto custom-scrollbar">
              {allDeckIds.map((deckId) => (
                  <Deck 
                      key={deckId} id={deckId}
                      onLoad={() => {}} onTogglePlay={() => togglePlay(deckId)} onStop={() => stopTrack(deckId)}
                      onStreamChange={(url) => changeStream(deckId, url)} onTrimChange={(v) => setDeckTrim(deckId, v)}
                      trim={1.0} onVolumeChange={(v) => setDeckVolume(deckId, v)} 
                      onAuxLevelChange={(auxIdx, v) => setAuxLevel(deckId, auxIdx, v)}
                      onEqChange={() => {}} onToggleEq={() => {}}
                      bitrate={decksBitrate[deckId]}
                      audioElement={getDeckElement(deckId)} analyser={getDeckAnalyser(deckId)} 
                  />
              ))}
          </div>

          {/* RIGHT COLUMN: SYSTEM CONTROLS & MASTER FADER */}
          <div className="w-[140px] flex flex-col gap-1 shrink-0 h-full overflow-hidden">
              <div className="flex-1 flex flex-col bg-[#0b111a] border border-slate-800 rounded-sm overflow-hidden shadow-2xl">
                  <div className="w-full text-center py-1.5 bg-[#162030] border-b border-slate-700 flex items-center justify-between px-3">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Master Bus</span>
                      <Settings size={12} className="text-slate-500" />
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto custom-scrollbar">
                      <button onClick={refreshAllStreams} className="w-full bg-[#1e293b] hover:bg-[#2d3b4e] border border-slate-700 text-slate-300 rounded py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                          <RefreshCw size={14} className="text-cyan-500" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">RELOAD STREAMS</span>
                      </button>

                      {/* HARDWARE ROUTING SECTION */}
                      <div className="bg-[#111a26] rounded border border-slate-800/50 p-2 shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1">
                               <Speaker size={8} /> HW ROUTING
                             </span>
                             <button onClick={refreshDevices} className="text-cyan-500 hover:text-cyan-400 active:rotate-180 transition-transform duration-300" title="Refresh Audio Cards">
                                <RefreshCw size={10} />
                             </button>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <div className="flex flex-col gap-0.5 border-b border-slate-800 pb-1.5 mb-1.5">
                                <div className="flex items-center justify-between mb-0.5 px-0.5">
                                    <span className="text-[7px] font-black text-red-500 uppercase italic tracking-tighter">MASTER OUT</span>
                                    <button onClick={() => toggleHardwareOutput('MASTER')} className={`p-1 rounded transition-all ${hwEnabled.MASTER ? 'bg-red-600 text-white shadow-[0_0_5px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-600'}`}>
                                        <Power size={6} />
                                    </button>
                                </div>
                                <select 
                                  onChange={(e) => setOutputDevice('MASTER', e.target.value)}
                                  className="w-full bg-[#050910] border border-slate-800 rounded px-1 py-1 text-[7px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="default">Default Speaker</option>
                                  {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Card ${d.deviceId.slice(0,5)}`}</option>)}
                                </select>
                              </div>
                              <div className="flex flex-col gap-0.5 border-b border-slate-800 pb-1.5 mb-1.5">
                                <div className="flex items-center justify-between mb-0.5 px-0.5">
                                    <span className="text-[7px] font-black text-green-500 uppercase italic tracking-tighter">AUX 1 OUT</span>
                                    <button onClick={() => toggleHardwareOutput('AUX1')} className={`p-1 rounded transition-all ${hwEnabled.AUX1 ? 'bg-green-600 text-white shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-800 text-slate-600'}`}>
                                        <Power size={6} />
                                    </button>
                                </div>
                                <select 
                                  onChange={(e) => setOutputDevice('AUX1', e.target.value)}
                                  className="w-full bg-[#050910] border border-slate-800 rounded px-1 py-1 text-[7px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="default">Default / Same</option>
                                  {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Card ${d.deviceId.slice(0,5)}`}</option>)}
                                </select>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center justify-between mb-0.5 px-0.5">
                                    <span className="text-[7px] font-black text-amber-500 uppercase italic tracking-tighter">AUX 2 OUT</span>
                                    <button onClick={() => toggleHardwareOutput('AUX2')} className={`p-1 rounded transition-all ${hwEnabled.AUX2 ? 'bg-amber-600 text-white shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'bg-slate-800 text-slate-600'}`}>
                                        <Power size={6} />
                                    </button>
                                </div>
                                <select 
                                  onChange={(e) => setOutputDevice('AUX2', e.target.value)}
                                  className="w-full bg-[#050910] border border-slate-800 rounded px-1 py-1 text-[7px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500"
                                >
                                  <option value="default">Default / Same</option>
                                  {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Card ${d.deviceId.slice(0,5)}`}</option>)}
                                </select>
                              </div>
                          </div>
                      </div>

                      <div className="bg-[#111a26] rounded border border-slate-800/50 p-2 shadow-inner">
                          <span className="text-[8px] font-black text-slate-500 uppercase block mb-2 text-center">Master Dynamics</span>
                          <div className="flex gap-1.5">
                              <button onClick={toggleCompressor} className={`flex-1 flex flex-col items-center py-2 rounded border transition-all ${isCompressorActive ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-[#0f172a] border-slate-800 text-slate-600'}`}>
                                  <Activity size={12} className="mb-0.5" />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">COMP</span>
                              </button>
                              <button onClick={toggleLimiter} className={`flex-1 flex flex-col items-center py-2 rounded border transition-all ${isLimiterActive ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-[#0f172a] border-slate-800 text-slate-600'}`}>
                                  <ShieldAlert size={12} className="mb-0.5" />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">LIMIT</span>
                              </button>
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col bg-[#1e3a57]/40 rounded border border-slate-800/50 p-2 min-h-[180px] shadow-2xl">
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-sm shadow-lg uppercase italic tracking-tighter">MIX L-R</span>
                          </div>
                          <div ref={masterFaderContainerRef} className="flex-1 relative bg-[#050910] rounded-sm border border-slate-800 shadow-inner overflow-hidden flex justify-center">
                              <div className="absolute inset-y-6 inset-x-0 flex flex-col justify-between items-center z-0 pointer-events-none opacity-40">
                                  <div className="absolute top-0 bottom-0 w-[1px] bg-slate-700/50"></div>
                                  {['0', '-6', '-12', '-24', '∞'].map((db, i) => (
                                      <div key={db} className="w-full flex items-center justify-center">
                                          <div className="w-full h-[1px] bg-slate-700/50"></div>
                                          <span className="absolute bg-[#050910] px-1.5 text-[8px] font-mono font-bold text-slate-500">{db}</span>
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

                      <div className="flex flex-col gap-1.5 mt-1">
                          <div className="bg-[#111a26] rounded border border-slate-800/50 p-1.5 flex items-center justify-between shadow-sm group">
                              <span className="text-[9px] font-black text-green-500 ml-1 group-hover:text-green-400 transition-colors">AUX 1</span>
                              <Knob value={aux1Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux1Vol(v); setAuxMasterVolume(1, v); }} min={0} max={1.2} label="" sizeClass="w-6 h-6" colorClass="bg-green-500" />
                          </div>
                          <div className="bg-[#111a26] rounded border border-slate-800/50 p-1.5 flex items-center justify-between shadow-sm group">
                              <span className="text-[9px] font-black text-amber-500 ml-1 group-hover:text-amber-400 transition-colors">AUX 2</span>
                              <Knob value={aux2Vol} onChange={(e) => { const v = parseFloat(e.target.value); setAux2Vol(v); setAuxMasterVolume(2, v); }} min={0} max={1.2} label="" sizeClass="w-6 h-6" colorClass="bg-amber-500" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* FOOTER TICKER */}
      <div className="w-full shrink-0 z-40 bg-black border-t border-slate-800/50">
          <NewsTickerComponent news={news} loading={newsLoading} label="TELETYPE ALICANTE" />
      </div>
    </div>
  );
}
