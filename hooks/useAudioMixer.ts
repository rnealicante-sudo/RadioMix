
import { useState, useEffect, useRef, useCallback } from 'react';
import { DeckId, RecorderState, ExportFormat } from '../types';

// Se ha intercambiado 'ES_RADIO' por 'D' (Radio 5 Alicante) en el orden del array
const DECKS: DeckId[] = ['MIC', 'A', 'RNE_EMISORAS', 'D', 'RADIO_MARCA', 'RADIO_ESPANA', 'C', 'ES_RADIO', 'E', 'F'];

export const RADIO_STATIONS_MAP: Record<string, { name: string, url: string }[]> = {
  'RNE_EMISORAS': [
    { name: 'RNE 1 (Nacional)', url: "https://rnelivestream.rtve.es/rne1/val/master.m3u8" },
    { name: 'RNE Clásica', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8" },
    { name: 'RNE 3', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r3_main.m3u8" },
    { name: 'RNE 4 (Catalunya)', url: "https://rnelivestream.rtve.es/rner4/main/master.m3u8" },
    { name: 'RNE 5 (Todo Noticias)', url: "https://rnelivestream.rtve.es/rne5/ali/master.m3u8" },
    { name: 'Radio Exterior (REE)', url: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_re_main.m3u8" },
  ],
  'A': [
    { name: 'RNE OCA 1', url: "https://rnelivestream.rtve.es/rneoca/oca1/master.m3u8" },
    { name: 'RNE OCA 2', url: "https://rnelivestream.rtve.es/rneoca/oca2/master.m3u8" },
    { name: 'RNE OCA 3', url: "https://rnelivestream.rtve.es/rneoca/oca3/master.m3u8" },
    { name: 'RNE OCA 4', url: "https://rnelivestream.rtve.es/rneoca/oca4/master.m3u8" },
    { name: 'RNE OCA 5', url: "https://rnelivestream.rtve.es/rneoca/oca5/master.m3u8" },
    { name: 'RNE OCA 6', url: "https://rnelivestream.rtve.es/rneoca/oca6/master.m3u8" },
  ],
  'F': [
    { name: 'SER Alicante', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALICANTEAAC.aac" },
    { name: 'SER Elche', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ELCHEAAC.aac" },
    { name: 'SER Orihuela', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ORIHUELAAAC.aac" },
    { name: 'SER Denia', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_DENIAAAC.aac" },
    { name: 'SER Elda', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ELDAAAC.aac" },
    { name: 'SER Alcoy', url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALCOYAAC.aac" },
  ],
  'C': [{ name: 'Onda Cero Alicante', url: "https://atres-live.ondacero.es/live/delegaciones/oc/alicante/master.m3u8" }],
  'D': [{ name: 'Radio 5 Alicante', url: "https://rnelivestream.rtve.es/rne5/ali/master.m3u8" }],
  'E': [{ name: 'COPE Alicante', url: "https://alicante-copesedes-rrcast.flumotion.com/copesedes/alicante.mp3" }],
  'MIC': [{ name: 'RNE 1 C. Valenciana', url: "https://rnelivestream.rtve.es/rne1/val/master.m3u8" }],
  'ES_RADIO': [{ name: 'ES RADIO', url: "https://sonic.mediatelekom.net/8274/stream" }],
  'RADIO_MARCA': [{ name: 'Radio Marca Valencia', url: "https://27913.live.streamtheworld.com/RADIOMARCA_VALENCIA.mp3" }],
  'RADIO_ESPANA': [{ name: 'Radio España Live', url: "https://stream-151.zeno.fm/7ywx2u45vv8uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiI3eXd4MnU0NXZ2OHV2IiwiaG9zdCI6InN0cmVhbS0xNTEuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6IjlEUENiQUlyUWJLSEk5RHhtZUtYVnciLCJpYXQiOjE3NzA0NTY1ODAsImV4cCI6MTc3MDQ1NjY0MH0.EJffqB_xW6mze4duK8MCJLAw9DM8twedeofwroZzB2s" }],
};

declare global {
  interface Window {
    lamejs: any;
    Hls: any;
    webkitAudioContext: any;
  }
}

interface DeckNodeGroup {
  source: MediaElementAudioSourceNode | null;
  inputGain: GainNode;
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;
  analyser: AnalyserNode;
  channelFader: GainNode;
  auxSendGain: GainNode;
  aux2SendGain: GainNode;
  element?: HTMLAudioElement;
  hls?: any;
  currentUrl?: string;
  bitrate?: number;
  eqBypass: boolean;
  eqValues: { L: number, M: number, H: number };
}

export const useAudioMixer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixBusRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const limiterRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const auxMasterGainRef = useRef<GainNode | null>(null);
  const aux2MasterGainRef = useRef<GainNode | null>(null);
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  const auxAnalyserRef = useRef<AnalyserNode | null>(null);
  const aux2AnalyserRef = useRef<AnalyserNode | null>(null);
  
  const decksRef = useRef<Map<DeckId, DeckNodeGroup>>(new Map());

  // Player Elements (Hardware interfaces)
  const masterAudioRef = useRef<HTMLAudioElement>(new Audio());
  const aux1AudioRef = useRef<HTMLAudioElement>(new Audio());
  const aux2AudioRef = useRef<HTMLAudioElement>(new Audio());

  const masterDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aux1DestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aux2DestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const recordersRef = useRef<Map<number, MediaRecorder>>(new Map());
  const recordingIntervalsRef = useRef<Map<number, number>>(new Map());

  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [decksBitrate, setDecksBitrate] = useState<Record<string, number>>({});
  const [isAnyPlaying, setIsAnyPlaying] = useState(false);
  const [isLimiterActive, setIsLimiterActive] = useState(true);
  const [isCompressorActive, setIsCompressorActive] = useState(false);

  // Default: Master output enabled, Aux outputs disabled (Strict isolation)
  const [hwEnabled, setHwEnabled] = useState({ MASTER: true, AUX1: false, AUX2: false });

  const [recState, setRecState] = useState<RecorderState[]>([
    { id: 0, isRecording: false, time: 0, chunks: [], source: 'MASTER', format: 'MP3' },
    { id: 1, isRecording: false, time: 0, chunks: [], source: 'AUX1', format: 'MP3' },
    { id: 2, isRecording: false, time: 0, chunks: [], source: 'AUX2', format: 'MP3' },
  ]);

  const updateGlobalPlayState = useCallback(() => {
    let playing = false;
    decksRef.current.forEach(d => {
      if (d.element && !d.element.paused) playing = true;
    });
    setIsAnyPlaying(playing);
  }, []);

  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    // Logic to play hardware audio elements if they have a stream and are enabled
    if (hwEnabled.MASTER) masterAudioRef.current.play().catch(() => {});
    if (hwEnabled.AUX1) aux1AudioRef.current.play().catch(() => {});
    if (hwEnabled.AUX2) aux2AudioRef.current.play().catch(() => {});
  }, [hwEnabled]);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      console.log(`System: Found ${audioOutputs.length} hardware audio outputs.`);
      setOutputDevices(audioOutputs);
    } catch (e) {
      console.error("Hardware: Error enumerating devices:", e);
    }
  }, []);

  const initHls = useCallback((el: HTMLAudioElement, url: string, deck: DeckNodeGroup, id: DeckId) => {
    if (deck.hls) { deck.hls.destroy(); deck.hls = null; }
    el.pause(); el.removeAttribute('src'); el.load();
    el.onplay = updateGlobalPlayState; el.onpause = updateGlobalPlayState;

    const isHlsUrl = url.includes('.m3u8');
    
    // Mixed Content Warning for GitHub Pages (HTTPS)
    if (window.location.protocol === 'https:' && url.startsWith('http:')) {
      console.warn(`Mixed Content Warning: The stream "${url}" is HTTP and will likely be blocked on HTTPS (GitHub Pages).`);
    }

    if (window.Hls && window.Hls.isSupported() && isHlsUrl) {
      const hls = new window.Hls({ 
          enableWorker: true, 
          lowLatencyMode: true, 
          backBufferLength: 0,
          manifestLoadingMaxRetry: 10
      });
      hls.loadSource(url); hls.attachMedia(el);
      hls.on(window.Hls.Events.LEVEL_LOADED, () => {
        const b = Math.round(hls.levels[hls.currentLevel]?.bitrate / 1000 || 128);
        setDecksBitrate(prev => ({ ...prev, [id]: b }));
      });
      deck.hls = hls;
    } else { 
      el.src = url; setDecksBitrate(prev => ({ ...prev, [id]: 128 }));
    }
    deck.currentUrl = url;
  }, [updateGlobalPlayState]);

  useEffect(() => {
    const initAudio = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass(); audioContextRef.current = ctx;

      const mixBus = ctx.createGain(); mixBusRef.current = mixBus;
      const compressor = ctx.createDynamicsCompressor(); compressorRef.current = compressor;
      const limiter = ctx.createDynamicsCompressor(); limiterRef.current = limiter;
      limiter.threshold.value = -1; limiter.ratio.value = 20;

      const masterGain = ctx.createGain(); masterGainRef.current = masterGain;
      const masterAnalyser = ctx.createAnalyser(); masterAnalyserRef.current = masterAnalyser;
      
      const aux1Bus = ctx.createGain(); auxMasterGainRef.current = aux1Bus;
      const aux2Bus = ctx.createGain(); aux2MasterGainRef.current = aux2Bus;
      const aux1An = ctx.createAnalyser(); auxAnalyserRef.current = aux1An;
      const aux2An = ctx.createAnalyser(); aux2AnalyserRef.current = aux2An;
      aux1Bus.connect(aux1An); aux2Bus.connect(aux2An);

      // Create strictly isolated destinations
      const mDest = ctx.createMediaStreamDestination(); masterDestRef.current = mDest;
      const a1Dest = ctx.createMediaStreamDestination(); aux1DestRef.current = a1Dest;
      const a2Dest = ctx.createMediaStreamDestination(); aux2DestRef.current = a2Dest;

      // Routing: Signal -> Analyser -> Physical Out (MediaStreamDestination)
      masterGain.connect(masterAnalyser).connect(mDest);
      aux1An.connect(a1Dest);
      aux2An.connect(a2Dest);

      // Link physical outputs to HTML Audio elements
      masterAudioRef.current.srcObject = mDest.stream;
      aux1AudioRef.current.srcObject = a1Dest.stream;
      aux2AudioRef.current.srcObject = a2Dest.stream;
      
      // Hardware Muting (Prevent accidental feedback)
      masterAudioRef.current.muted = false; // Master audible by default
      aux1AudioRef.current.muted = true;  // Aux silent until assigned and turned on
      aux2AudioRef.current.muted = true;

      DECKS.forEach(id => {
        const inputGain = ctx.createGain();
        const low = ctx.createBiquadFilter(); low.type = 'lowshelf';
        const mid = ctx.createBiquadFilter(); mid.type = 'peaking';
        const high = ctx.createBiquadFilter(); high.type = 'highshelf';
        const analyser = ctx.createAnalyser();
        const fader = ctx.createGain();
        const aux1 = ctx.createGain(); aux1.gain.value = 0;
        const aux2 = ctx.createGain(); aux2.gain.value = 0;
        
        // Input -> EQ -> Meter -> Channel Fader -> Master Mix
        inputGain.connect(low).connect(mid).connect(high).connect(analyser).connect(fader).connect(mixBus);
        
        // Auxiliary Parallel Routing (Pre-Fader)
        analyser.connect(aux1).connect(aux1Bus);
        analyser.connect(aux2).connect(aux2Bus);

        const el = new Audio(); el.crossOrigin = "anonymous";
        
        // Fallback for CORS issues (allows audio to play even if visualizer fails)
        el.addEventListener('error', () => {
            if (el.crossOrigin) {
                console.warn(`CORS error on deck ${id}. Disabling crossOrigin to allow playback.`);
                el.removeAttribute('crossOrigin');
                const src = el.src;
                el.src = '';
                setTimeout(() => { 
                    el.src = src; 
                    el.play().catch(() => console.log("Playback prevented by browser")); 
                }, 50);
            }
        });

        const source = ctx.createMediaElementSource(el); source.connect(inputGain);
        
        const deck: DeckNodeGroup = {
          source, inputGain, lowFilter: low, midFilter: mid, highFilter: high, analyser,
          channelFader: fader, auxSendGain: aux1, aux2SendGain: aux2, element: el,
          eqBypass: true, eqValues: { L: 0, M: 0, H: 0 }
        };
        
        const initialStation = RADIO_STATIONS_MAP[id]?.[0] || { name: id, url: '' };
        if (initialStation.url) { initHls(el, initialStation.url, deck, id); }
        decksRef.current.set(id, deck);
      });
      
      refreshDevices();
    };
    initAudio();
  }, [initHls, refreshDevices]);

  // Master Dynamics Chain (Compressor -> Limiter)
  useEffect(() => {
    if (!mixBusRef.current || !masterGainRef.current || !compressorRef.current || !limiterRef.current) return;
    mixBusRef.current.disconnect(); 
    compressorRef.current.disconnect(); 
    limiterRef.current.disconnect();
    
    let node: AudioNode = mixBusRef.current;
    if (isCompressorActive) { node.connect(compressorRef.current); node = compressorRef.current; }
    if (isLimiterActive) { node.connect(limiterRef.current); node = limiterRef.current; }
    node.connect(masterGainRef.current);
  }, [isCompressorActive, isLimiterActive]);

  const setOutputDevice = useCallback(async (bus: 'MASTER' | 'AUX1' | 'AUX2', deviceId: string) => {
    const el = bus === 'MASTER' ? masterAudioRef.current : bus === 'AUX1' ? aux1AudioRef.current : aux2AudioRef.current;
    if ('setSinkId' in el) {
      try { 
          await (el as any).setSinkId(deviceId);
          console.log(`Hardware: Routed ${bus} to device ID: ${deviceId}`);
          // Ensure playback continues on the new device
          if (el.srcObject) el.play().catch(() => {});
      } catch (err) { 
          console.error(`Hardware: Failed to route ${bus}:`, err); 
      }
    } else {
        console.warn("Hardware: Browser does not support output device selection (setSinkId).");
    }
  }, []);

  const toggleHardwareOutput = useCallback((bus: 'MASTER' | 'AUX1' | 'AUX2') => {
    setHwEnabled(prev => {
        const nextState = !prev[bus];
        const next = { ...prev, [bus]: nextState };
        const el = bus === 'MASTER' ? masterAudioRef.current : bus === 'AUX1' ? aux1AudioRef.current : aux2AudioRef.current;
        el.muted = !nextState;
        if (nextState) {
            el.play().catch(() => {});
            console.log(`Hardware: Bus ${bus} is now active (unmuted).`);
        } else {
            console.log(`Hardware: Bus ${bus} is now isolated (muted).`);
        }
        return next;
    });
  }, []);

  const startRecording = useCallback((id: number) => {
    const state = recState[id];
    const dest = id === 0 ? masterDestRef.current : id === 1 ? aux1DestRef.current : aux2DestRef.current;
    if (!dest) return;
    const mimeType = state.format === 'OGG' ? 'audio/ogg' : 'audio/webm';
    const recorder = new MediaRecorder(dest.stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      setRecState(prev => prev.map(s => s.id === id ? { ...s, isRecording: false, chunks: [...chunks] } : s));
    };
    recorder.start();
    recordersRef.current.set(id, recorder);
    const intervalId = window.setInterval(() => {
      setRecState(prev => prev.map(s => s.id === id ? { ...s, time: s.time + 1 } : s));
    }, 1000);
    recordingIntervalsRef.current.set(id, intervalId);
    setRecState(prev => prev.map(s => s.id === id ? { ...s, isRecording: true, time: 0, chunks: [] } : s));
  }, [recState]);

  const stopRecording = useCallback((id: number) => {
    const recorder = recordersRef.current.get(id);
    if (recorder) { recorder.stop(); recordersRef.current.delete(id); }
    const intervalId = recordingIntervalsRef.current.get(id);
    if (intervalId) { clearInterval(intervalId); recordingIntervalsRef.current.delete(id); }
  }, []);

  const clearRecorder = useCallback((id: number) => {
    setRecState(prev => prev.map(s => s.id === id ? { ...s, time: 0, chunks: [], isRecording: false } : s));
  }, []);

  const exportRecording = useCallback((id: number) => {
    const state = recState[id];
    if (state.chunks.length === 0) return;
    const blob = new Blob(state.chunks, { type: state.chunks[0].type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ReVoxMix_${state.source}_${new Date().toISOString().slice(0,19)}.${state.format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [recState]);

  const setFormat = useCallback((id: number, format: ExportFormat) => {
    setRecState(prev => prev.map(s => s.id === id ? { ...s, format } : s));
  }, []);

  return {
    allDeckIds: DECKS,
    togglePlay: (id: DeckId) => { resumeContext(); const d = decksRef.current.get(id); d?.element?.paused ? d?.element?.play() : d?.element?.pause(); },
    stopTrack: (id: DeckId) => { const d = decksRef.current.get(id); if(d?.element) { d.element.pause(); d.element.currentTime = 0; } },
    changeStream: (id: DeckId, url: string) => { resumeContext(); const d = decksRef.current.get(id); if(d?.element) initHls(d.element, url, d, id); },
    setDeckVolume: (id: DeckId, v: number) => { const d = decksRef.current.get(id); d?.channelFader.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05); },
    setMasterVolume: (v: number) => { resumeContext(); masterGainRef.current?.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05); },
    setAuxMasterVolume: (idx: 1|2, v: number) => (idx === 1 ? auxMasterGainRef : aux2MasterGainRef).current?.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05),
    setAuxLevel: (id: DeckId, idx: 1|2, v: number) => (idx === 1 ? decksRef.current.get(id)?.auxSendGain : decksRef.current.get(id)?.aux2SendGain)?.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.01),
    setDeckTrim: (id: DeckId, v: number) => decksRef.current.get(id)?.inputGain.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05),
    getMasterAnalyser: () => masterAnalyserRef.current,
    getAuxAnalyser: () => auxAnalyserRef.current,
    getAux2Analyser: () => aux2AnalyserRef.current,
    getDeckAnalyser: (id: DeckId) => decksRef.current.get(id)?.analyser,
    getDeckElement: (id: DeckId) => decksRef.current.get(id)?.element,
    isLimiterActive, toggleLimiter: () => setIsLimiterActive(!isLimiterActive),
    isCompressorActive, toggleCompressor: () => setIsCompressorActive(!isCompressorActive),
    recorders: recState,
    startRecording, stopRecording, clearRecorder, setFormat, exportRecording,
    refreshAllStreams: () => {
        decksRef.current.forEach((deck, id) => {
          if (deck.element && deck.currentUrl) { initHls(deck.element, deck.currentUrl, deck, id); }
        });
    },
    outputDevices, setOutputDevice, isAnyPlaying, decksBitrate,
    hwEnabled, toggleHardwareOutput, refreshDevices,
    setDeckEq: (id: DeckId, b: string, v: number) => {},
    toggleDeckEq: (id: DeckId) => {},
    setSchedule: (id: number, s: string, e: string) => {},
  };
};
