
import { useState, useEffect, useRef, useCallback } from 'react';
import { DeckId, CrossfaderAssignment, RecorderState, ExportFormat } from '../types';

const DECKS: DeckId[] = ['LIVE_MIC', 'MIC', 'A', 'RNE_EMISORAS', 'ES_RADIO', 'RADIO_MARCA', 'RADIO_ESPANA', 'C', 'D', 'E', 'F'];

const RADIO_URLS = {
  R1CV: "https://rnelivestream.rtve.es/rne1/val/master.m3u8",
  R_CLASICA: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8",
  R3: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r3_main.m3u8",
  R4_CAT: "https://rnelivestream.rtve.es/rner4/main/master.m3u8",
  REE: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_re_main.m3u8",
  ONDA_CERO: "https://atres-live.ondacero.es/live/delegaciones/oc/alicante/master.m3u8",
  R5: "https://rnelivestream.rtve.es/rne5/ali/master.m3u8",
  COPE: "https://alicante-copesedes-rrcast.flumotion.com/copesedes/alicante.mp3",
  SER_PROVINCIAL: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALICANTEAAC.aac",
  OCA1: "https://rnelivestream.rtve.es/rneoca/oca1/master.m3u8",
  ES_RADIO: "https://sonic.mediatelekom.net/8274/stream",
  RADIO_MARCA: "http://relay.stream.enacast-cloud.com:8000/marcalinkdelegaciones256.mp3",
  RADIO_ESPANA: "https://stream-151.zeno.fm/7ywx2u45vv8uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiI3eXd4MnU0NXZ2OHV2IiwiaG9zdCI6InN0cmVhbS0xNTEuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6IjlEUENiQUlyUWJLSEk5RHhtZUtYVnciLCJpYXQiOjE3NzA0NTY1ODAsImV4cCI6MTc3MDQ1NjY0MH0.EJffqB_xW6mze4duK8MCJLAw9DM8twedeofwroZzB2s",
};

declare global {
    interface Window {
        lamejs: any;
        Hls: any;
        webkitAudioContext: any;
    }
}

interface DeckNodeGroup {
  source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null;
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
  micStream?: MediaStream;
  bitrate?: number;
  eqBypass: boolean;
  eqValues: { L: number, M: number, H: number };
}

export const useAudioMixer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const auxMasterGainRef = useRef<GainNode | null>(null);
  const aux2MasterGainRef = useRef<GainNode | null>(null);
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  const auxAnalyserRef = useRef<AnalyserNode | null>(null);
  const aux2AnalyserRef = useRef<AnalyserNode | null>(null);
  
  const mixBusRef = useRef<GainNode | null>(null);
  const decksRef = useRef<Map<DeckId, DeckNodeGroup>>(new Map());

  // Monitor Elements (Hidden Audio Elements for Routing)
  const masterMonitorRef = useRef<HTMLAudioElement>(new Audio());
  const aux1MonitorRef = useRef<HTMLAudioElement>(new Audio());
  const aux2MonitorRef = useRef<HTMLAudioElement>(new Audio());

  const [activeStation, setActiveStation] = useState<{name: string, bitrate: number | string} | null>(null);
  const [decksBitrate, setDecksBitrate] = useState<Record<string, number>>({});
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [isAnyPlaying, setIsAnyPlaying] = useState(false);

  const [recState, setRecState] = useState<RecorderState[]>([
    { id: 0, isRecording: false, time: 0, chunks: [], source: 'MASTER', format: 'MP3' },
    { id: 1, isRecording: false, time: 0, chunks: [], source: 'AUX1', format: 'MP3' },
    { id: 2, isRecording: false, time: 0, chunks: [], source: 'AUX2', format: 'MP3' },
  ]);

  const mediaRecorders = useRef<(MediaRecorder | null)[]>([null, null, null]);
  const streamDestinations = useRef<(MediaStreamAudioDestinationNode | null)[]>([null, null, null]);

  const [isLimiterActive, setIsLimiterActive] = useState(true);
  const [isCompressorActive, setIsCompressorActive] = useState(false);

  const updateGlobalPlayState = useCallback(() => {
    let playing = false;
    decksRef.current.forEach(d => {
        if (d.element && !d.element.paused) playing = true;
    });
    setIsAnyPlaying(playing);
  }, []);

  const resumeContext = useCallback(async () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    // Ensure monitors play
    masterMonitorRef.current.play().catch(() => {});
    aux1MonitorRef.current.play().catch(() => {});
    aux2MonitorRef.current.play().catch(() => {});
  }, []);

  const initHls = useCallback((el: HTMLAudioElement, url: string, deck: DeckNodeGroup, id: DeckId) => {
    if (deck.hls) {
      deck.hls.destroy();
      deck.hls = null;
    }
    el.pause(); el.load();

    // Attach listeners for global play state
    el.onplay = updateGlobalPlayState;
    el.onpause = updateGlobalPlayState;

    const isHlsUrl = url.includes('.m3u8') || url.includes('master.m3u8');
    if (window.Hls && window.Hls.isSupported() && isHlsUrl) {
      const hls = new window.Hls({ enableWorker: true });
      hls.loadSource(url); hls.attachMedia(el);
      hls.on(window.Hls.Events.LEVEL_LOADED, () => {
        const b = Math.round(hls.levels[hls.currentLevel]?.bitrate / 1000 || 128);
        deck.bitrate = b;
        setDecksBitrate(prev => ({ ...prev, [id]: b }));
      });
      deck.hls = hls;
    } else { 
      el.src = url; 
      deck.bitrate = 128;
      setDecksBitrate(prev => ({ ...prev, [id]: 128 }));
    }
    deck.currentUrl = url;
  }, [updateGlobalPlayState]);

  // Enumerar dispositivos de salida
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Solicitar permiso para ver labels
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setOutputDevices(outputs);
      } catch (err) {
        console.warn("No se pudieron enumerar dispositivos de audio", err);
      }
    };
    getDevices();
    navigator.mediaDevices.ondevicechange = getDevices;
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass(); audioContextRef.current = ctx;

      const mixBus = ctx.createGain(); mixBusRef.current = mixBus;
      const masterGain = ctx.createGain(); masterGainRef.current = masterGain;
      // Faster FFT size for Master visualizer responsiveness
      const masterAnalyser = ctx.createAnalyser(); 
      masterAnalyser.fftSize = 1024; 
      masterAnalyser.smoothingTimeConstant = 0.1;
      masterAnalyserRef.current = masterAnalyser;
      
      mixBus.connect(masterGain).connect(masterAnalyser); 

      const auxMasterGain = ctx.createGain(); auxMasterGainRef.current = auxMasterGain;
      const auxAnalyser = ctx.createAnalyser(); 
      auxAnalyser.fftSize = 512; 
      auxAnalyser.smoothingTimeConstant = 0.1;
      auxAnalyserRef.current = auxAnalyser;
      auxMasterGain.connect(auxAnalyser);
      
      const aux2MasterGain = ctx.createGain(); aux2MasterGainRef.current = aux2MasterGain;
      const aux2Analyser = ctx.createAnalyser(); 
      aux2Analyser.fftSize = 512;
      aux2Analyser.smoothingTimeConstant = 0.1; 
      aux2AnalyserRef.current = aux2Analyser;
      aux2MasterGain.connect(aux2Analyser);

      // Recording Destinations
      streamDestinations.current[0] = ctx.createMediaStreamDestination(); masterGain.connect(streamDestinations.current[0]);
      streamDestinations.current[1] = ctx.createMediaStreamDestination(); auxMasterGain.connect(streamDestinations.current[1]);
      streamDestinations.current[2] = ctx.createMediaStreamDestination(); aux2MasterGain.connect(streamDestinations.current[2]);

      // Monitor Destinations (For Audio Output Routing)
      const masterMonitorDest = ctx.createMediaStreamDestination();
      masterGain.connect(masterMonitorDest);
      masterMonitorRef.current.srcObject = masterMonitorDest.stream;

      const aux1MonitorDest = ctx.createMediaStreamDestination();
      auxMasterGain.connect(aux1MonitorDest);
      aux1MonitorRef.current.srcObject = aux1MonitorDest.stream;

      const aux2MonitorDest = ctx.createMediaStreamDestination();
      aux2MasterGain.connect(aux2MonitorDest);
      aux2MonitorRef.current.srcObject = aux2MonitorDest.stream;

      DECKS.forEach(id => {
        const inputGain = ctx.createGain();
        const lowFilter = ctx.createBiquadFilter(); lowFilter.type = 'lowshelf'; lowFilter.frequency.value = 100;
        const midFilter = ctx.createBiquadFilter(); midFilter.type = 'peaking'; midFilter.frequency.value = 1000; midFilter.Q.value = 1.0;
        const highFilter = ctx.createBiquadFilter(); highFilter.type = 'highshelf'; highFilter.frequency.value = 8000;
        
        // Use a smaller FFT size for deck meters to ensure zero visual lag
        const analyser = ctx.createAnalyser(); 
        analyser.fftSize = 256; 
        analyser.smoothingTimeConstant = 0.1;

        const channelFader = ctx.createGain();
        const auxSendGain = ctx.createGain(); auxSendGain.gain.value = 0;
        const aux2SendGain = ctx.createGain(); aux2SendGain.gain.value = 0;
        
        inputGain.connect(lowFilter).connect(midFilter).connect(highFilter).connect(analyser).connect(channelFader).connect(mixBus);
        analyser.connect(auxSendGain).connect(auxMasterGain);
        analyser.connect(aux2SendGain).connect(aux2MasterGain);
        
        const deckGroup: DeckNodeGroup = { 
          source: null, inputGain, lowFilter, midFilter, highFilter, analyser, channelFader, 
          auxSendGain, aux2SendGain, eqBypass: false, eqValues: { L: 0, M: 0, H: 0 }
        };

        if (id !== 'LIVE_MIC') {
          const el = new Audio(); el.crossOrigin = "anonymous";
          
          el.onplay = updateGlobalPlayState;
          el.onpause = updateGlobalPlayState;

          let url = RADIO_URLS.R1CV;
          if (id === 'A') url = RADIO_URLS.OCA1;
          if (id === 'RNE_EMISORAS') url = RADIO_URLS.R1CV;
          if (id === 'C') url = RADIO_URLS.ONDA_CERO;
          if (id === 'D') url = RADIO_URLS.R5;
          if (id === 'E') url = RADIO_URLS.COPE;
          if (id === 'F') url = RADIO_URLS.SER_PROVINCIAL;
          if (RADIO_URLS[id as keyof typeof RADIO_URLS]) url = RADIO_URLS[id as keyof typeof RADIO_URLS];

          initHls(el, url, deckGroup, id);
          deckGroup.source = ctx.createMediaElementSource(el);
          deckGroup.source.connect(inputGain);
          deckGroup.element = el;
        }
        decksRef.current.set(id, deckGroup);
      });
    };
    initAudio();
  }, [initHls, updateGlobalPlayState]);

  const setOutputDevice = async (bus: 'MASTER' | 'AUX1' | 'AUX2', deviceId: string) => {
      const element = bus === 'MASTER' ? masterMonitorRef.current : bus === 'AUX1' ? aux1MonitorRef.current : aux2MonitorRef.current;
      if ('setSinkId' in element) {
          try {
              await (element as any).setSinkId(deviceId);
          } catch (e) {
              console.error(`Error setting sinkId for ${bus}`, e);
          }
      }
  };

  const refreshAllStreams = useCallback(() => {
    resumeContext();
    decksRef.current.forEach((deck, id) => {
      if (deck.element && deck.currentUrl) {
         initHls(deck.element, deck.currentUrl, deck, id);
      }
    });
  }, [initHls, resumeContext]);

  return {
    allDeckIds: DECKS, activeStation, decksBitrate,
    changeStream: (id: DeckId, url: string) => { resumeContext(); const d = decksRef.current.get(id); if(d && d.element) initHls(d.element, url, d, id); },
    getMasterAnalyser: () => masterAnalyserRef.current,
    getAuxAnalyser: () => auxAnalyserRef.current,
    getAux2Analyser: () => aux2AnalyserRef.current,
    getDeckAnalyser: (id: DeckId) => decksRef.current.get(id)?.analyser,
    getDeckElement: (id: DeckId) => decksRef.current.get(id)?.element,
    togglePlay: (deck: DeckId) => { resumeContext(); const t = decksRef.current.get(deck); if(t?.element) t.element.paused ? t.element.play() : t.element.pause(); },
    stopTrack: (deck: DeckId) => { const t = decksRef.current.get(deck); if(t?.element) { t.element.pause(); t.element.currentTime = 0; } },
    setDeckTrim: (id: DeckId, v: number) => { const d = decksRef.current.get(id); if(d && audioContextRef.current) d.inputGain.gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.05); },
    setDeckVolume: (id: DeckId, v: number) => { const d = decksRef.current.get(id); if(d && audioContextRef.current) d.channelFader.gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.05); },
    setDeckEq: (id: DeckId, band: 'L' | 'M' | 'H', gain: number) => {
      const d = decksRef.current.get(id);
      if(!d || !audioContextRef.current) return;
      d.eqValues[band] = gain;
      if (!d.eqBypass) {
        const filter = band === 'L' ? d.lowFilter : band === 'M' ? d.midFilter : d.highFilter;
        filter.gain.setTargetAtTime(gain, audioContextRef.current.currentTime, 0.05);
      }
    },
    toggleDeckEq: (id: DeckId) => {
      const d = decksRef.current.get(id);
      if(!d || !audioContextRef.current) return;
      d.eqBypass = !d.eqBypass;
      const targetGainL = d.eqBypass ? 0 : d.eqValues.L;
      const targetGainM = d.eqBypass ? 0 : d.eqValues.M;
      const targetGainH = d.eqBypass ? 0 : d.eqValues.H;
      const t = audioContextRef.current.currentTime;
      d.lowFilter.gain.setTargetAtTime(targetGainL, t, 0.05);
      d.midFilter.gain.setTargetAtTime(targetGainM, t, 0.05);
      d.highFilter.gain.setTargetAtTime(targetGainH, t, 0.05);
    },
    setMasterVolume: (v: number) => { resumeContext(); if(masterGainRef.current && audioContextRef.current) masterGainRef.current.gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.05); },
    setAuxLevel: (id: DeckId, auxIdx: 1 | 2, v: number) => { const d = decksRef.current.get(id); if(d && audioContextRef.current) (auxIdx === 1 ? d.auxSendGain : d.aux2SendGain).gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.01); },
    setAuxMasterVolume: (auxIdx: 1 | 2, v: number) => { 
        if(audioContextRef.current) {
            const gainNode = auxIdx === 1 ? auxMasterGainRef.current : aux2MasterGainRef.current;
            if(gainNode) gainNode.gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.05);
        }
    },
    isLimiterActive, toggleLimiter: () => setIsLimiterActive(!isLimiterActive),
    isCompressorActive, toggleCompressor: () => setIsCompressorActive(!isCompressorActive),
    recorders: recState,
    startRecording: (id: number) => {
      resumeContext(); const stream = streamDestinations.current[id]?.stream; if(!stream) return;
      const rec = new MediaRecorder(stream); const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => setRecState(prev => prev.map(r => r.id === id ? { ...r, chunks: [...chunks], isRecording: false } : r));
      rec.start(); mediaRecorders.current[id] = rec;
      setRecState(prev => prev.map(r => r.id === id ? { ...r, isRecording: true, time: 0, chunks: [] } : r));
    },
    stopRecording: (id: number) => mediaRecorders.current[id]?.stop(),
    clearRecorder: (id: number) => setRecState(p => p.map(r => r.id === id ? {...r, chunks: [], time: 0} : r)),
    exportRecording: (id: number) => {}, 
    setFormat: (id: number, f: ExportFormat) => setRecState(p => p.map(r => r.id === id ? {...r, format: f} : r)),
    setupLiveMic: async (deviceId: string) => {
      resumeContext(); const ctx = audioContextRef.current; if (!ctx) return;
      const deck = decksRef.current.get('LIVE_MIC'); if (!deck) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined } });
        const source = ctx.createMediaStreamSource(stream); source.connect(deck.inputGain);
        deck.source = source; deck.micStream = stream;
      } catch (err) { console.error(err); }
    },
    refreshAllStreams,
    outputDevices,
    setOutputDevice,
    isAnyPlaying
  };
};
