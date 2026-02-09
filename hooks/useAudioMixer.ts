
import { useState, useEffect, useRef, useCallback } from 'react';
import { DeckId, CrossfaderAssignment, RecorderState, ExportFormat } from '../types';

const DECKS: DeckId[] = ['LIVE_MIC', 'MIC', 'A', 'RNE_EMISORAS', 'RADIO_UMH', 'ES_RADIO', 'RADIO_MARCA', 'RADIO_ESPANA', 'C', 'D', 'E', 'F'];

const RADIO_URLS = {
  R1CV: "https://rnelivestream.rtve.es/rne1/val/master.m3u8",
  R_CLASICA: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r2_main.m3u8",
  R3: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_r3_main.m3u8",
  R4_CAT: "https://rnelivestream.rtve.es/rner4/main/master.m3u8",
  REE: "https://rtvelivestream.rtve.es/rtvesec/rne/rne_re_main.m3u8",
  ONDA_CERO: "https://atres-live.ondacero.es/live/delegaciones/oc/valenciaeventos/master.m3u8",
  R5: "https://rnelivestream.rtve.es/rne5/ali/master.m3u8",
  COPE: "https://alicante-copesedes-rrcast.flumotion.com/copesedes/alicante.mp3",
  SER: "https://playerservices.streamtheworld.com/api/livestream-redirect/SER_ALICANTEAAC.aac",
  OCA1: "https://rnelivestream.rtve.es/rneoca/oca1/master.m3u8",
  RADIO_UMH: "https://laradioendirecto.umh.es/;",
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
  analyser: AnalyserNode;
  channelFader: GainNode; 
  xfaderGain: GainNode; 
  auxSendGain: GainNode; 
  aux2SendGain: GainNode; 
  element?: HTMLAudioElement; 
  hls?: any; 
  currentUrl?: string;
  micStream?: MediaStream;
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

  const [recState, setRecState] = useState<RecorderState[]>([
    { id: 0, isRecording: false, time: 0, chunks: [], source: 'MASTER', format: 'MP3' },
    { id: 1, isRecording: false, time: 0, chunks: [], source: 'AUX1', format: 'MP3' },
    { id: 2, isRecording: false, time: 0, chunks: [], source: 'AUX2', format: 'MP3', scheduledStart: '', scheduledEnd: '' },
  ]);

  const mediaRecorders = useRef<(MediaRecorder | null)[]>([null, null, null]);
  const streamDestinations = useRef<(MediaStreamAudioDestinationNode | null)[]>([null, null, null]);

  const [isLimiterActive, setIsLimiterActive] = useState(true);
  const [isCompressorActive, setIsCompressorActive] = useState(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);

  const resumeContext = useCallback(async () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        console.warn("AudioContext resume failed:", e);
      }
    }
  }, []);

  const initHls = useCallback((el: HTMLAudioElement, url: string, deck: DeckNodeGroup) => {
    if (deck.hls) {
      deck.hls.stopLoad();
      deck.hls.detachMedia();
      deck.hls.destroy();
      deck.hls = null;
    }
    el.pause();
    el.removeAttribute('src');
    el.load();

    const isHlsUrl = url.includes('.m3u8') || url.includes('master.m3u8');
    if (window.Hls && window.Hls.isSupported() && isHlsUrl) {
      const hls = new window.Hls({ 
        enableWorker: true, 
        lowLatencyMode: true,
        maxBufferLength: 30
      });
      hls.loadSource(url);
      hls.attachMedia(el);
      deck.hls = hls;
    } else { 
      el.src = url; 
    }
    deck.currentUrl = url;
  }, []);

  const changeStream = useCallback((id: DeckId, url: string) => {
    const deck = decksRef.current.get(id);
    if (deck && deck.element) {
      initHls(deck.element, url, deck);
    }
  }, [initHls]);

  useEffect(() => {
    const initAudio = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.error("Navegador no compatible con Web Audio API");
        return;
      }

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const mixBus = ctx.createGain();
      mixBusRef.current = mixBus;
      const masterGain = ctx.createGain();
      masterGainRef.current = masterGain;

      const masterAnalyser = ctx.createAnalyser();
      masterAnalyser.fftSize = 2048;
      masterAnalyserRef.current = masterAnalyser;
      
      mixBus.connect(masterGain);
      masterGain.connect(masterAnalyser);
      masterAnalyser.connect(ctx.destination);

      const auxMasterGain = ctx.createGain();
      auxMasterGainRef.current = auxMasterGain;
      const auxAnalyser = ctx.createAnalyser();
      auxAnalyser.fftSize = 512;
      auxAnalyserRef.current = auxAnalyser;
      auxMasterGain.connect(auxAnalyser);
      
      const aux2MasterGain = ctx.createGain();
      aux2MasterGainRef.current = aux2MasterGain;
      const aux2Analyser = ctx.createAnalyser();
      aux2Analyser.fftSize = 512;
      aux2AnalyserRef.current = aux2Analyser;
      aux2MasterGain.connect(aux2Analyser);

      streamDestinations.current[0] = ctx.createMediaStreamDestination();
      masterGain.connect(streamDestinations.current[0]);

      streamDestinations.current[1] = ctx.createMediaStreamDestination();
      auxMasterGain.connect(streamDestinations.current[1]);

      streamDestinations.current[2] = ctx.createMediaStreamDestination();
      aux2MasterGain.connect(streamDestinations.current[2]);

      DECKS.forEach(id => {
        const inputGain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        const channelFader = ctx.createGain();
        const auxSendGain = ctx.createGain(); 
        auxSendGain.gain.value = 0;
        const aux2SendGain = ctx.createGain(); 
        aux2SendGain.gain.value = 0;
        
        inputGain.connect(analyser); 
        analyser.connect(channelFader);
        
        // Envíos auxiliares (Post-Gain, Pre-Fader para monitoreo/grabación independiente)
        analyser.connect(auxSendGain); 
        auxSendGain.connect(auxMasterGain);
        analyser.connect(aux2SendGain); 
        aux2SendGain.connect(aux2MasterGain);
        
        channelFader.connect(mixBus);

        const deckGroup: DeckNodeGroup = { 
          source: null, inputGain, analyser, channelFader, 
          xfaderGain: ctx.createGain(), auxSendGain, aux2SendGain 
        };

        if (id !== 'LIVE_MIC') {
          const el = new Audio();
          el.crossOrigin = "anonymous";
          el.preload = "none"; 
          
          let url = RADIO_URLS.R1CV;
          if (id === 'A') url = RADIO_URLS.OCA1;
          if (id === 'RNE_EMISORAS') url = RADIO_URLS.R_CLASICA;
          if (id === 'RADIO_UMH') url = RADIO_URLS.RADIO_UMH;
          if (id === 'ES_RADIO') url = RADIO_URLS.ES_RADIO;
          if (id === 'RADIO_MARCA') url = RADIO_URLS.RADIO_MARCA;
          if (id === 'RADIO_ESPANA') url = RADIO_URLS.RADIO_ESPANA;
          if (id === 'C') url = RADIO_URLS.ONDA_CERO;
          if (id === 'D') url = RADIO_URLS.R5;
          if (id === 'E') url = RADIO_URLS.COPE;
          if (id === 'F') url = RADIO_URLS.SER;

          initHls(el, url, deckGroup);
          deckGroup.source = ctx.createMediaElementSource(el);
          deckGroup.source.connect(inputGain);
          deckGroup.element = el;
        }
        decksRef.current.set(id, deckGroup);
      });

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setInputDevices(devices.filter(d => d.kind === 'audioinput'));
      } catch (e) {
        console.warn("Error enumerating devices:", e);
      }
    };

    initAudio();
  }, [initHls]);

  const startRecording = (id: number) => {
      resumeContext();
      const stream = streamDestinations.current[id]?.stream;
      if (!stream) return;
      
      try {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            setRecState(prev => prev.map(r => r.id === id ? { ...r, chunks: [...chunks], isRecording: false } : r));
        };
        recorder.start();
        mediaRecorders.current[id] = recorder;
        setRecState(prev => prev.map(r => r.id === id ? { ...r, isRecording: true, time: 0, chunks: [] } : r));
      } catch (e) {
        console.error("MediaRecorder no soportado:", e);
      }
  };

  const stopRecording = (id: number) => {
      mediaRecorders.current[id]?.stop();
  };

  const exportRecording = async (id: number) => {
      const r = recState[id];
      if (r.chunks.length === 0) return;
      const blob = new Blob(r.chunks, { type: 'audio/webm' });

      if (r.format === 'WEBM' || r.format === 'OGG') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ReVoxMix_${r.source}_${new Date().getTime()}.${r.format.toLowerCase()}`;
        a.click();
        return;
      }

      const arrayBuffer = await blob.arrayBuffer();
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      
      try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (r.format === 'WAV') {
            const wavBlob = audioBufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url; a.download = `ReVoxMix_${r.source}.wav`; a.click();
            return;
        }

        if (window.lamejs) {
            const mp3encoder = new window.lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
            const samples = audioBuffer.getChannelData(0);
            const sampleBlockSize = 1152;
            const mp3Data = [];
            const int16Samples = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
              int16Samples[i] = samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7FFF;
            }
            for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
              const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
              const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
              if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            const end = mp3encoder.flush();
            if (end.length > 0) mp3Data.push(end);
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            a.href = url; a.download = `ReVoxMix_${r.source}.mp3`; a.click();
        }
      } catch (e) { console.error("Conversión fallida:", e); }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let pos = 0;

    const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };
    const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);

    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            let s = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            pos += 2;
        }
    }
    return new Blob([bufferArray], { type: "audio/wav" });
  };

  return {
    inputDevices, allDeckIds: DECKS, changeStream: (id: DeckId, url: string) => { resumeContext(); changeStream(id, url); },
    getMasterAnalyser: () => masterAnalyserRef.current,
    getAuxAnalyser: () => auxAnalyserRef.current,
    getAux2Analyser: () => aux2AnalyserRef.current,
    getDeckAnalyser: (id: DeckId) => decksRef.current.get(id)?.analyser,
    getDeckElement: (id: DeckId) => decksRef.current.get(id)?.element,
    togglePlay: (deck: DeckId) => {
        resumeContext();
        const target = decksRef.current.get(deck);
        if(target?.element) {
            if(target.element.paused) target.element.play().catch(e => console.warn(e));
            else target.element.pause();
        }
    },
    stopTrack: (deck: DeckId) => {
        resumeContext();
        const target = decksRef.current.get(deck);
        if(target?.element) { target.element.pause(); target.element.currentTime = 0; }
    },
    setDeckTrim: (id: DeckId, v: number) => {
        const d = decksRef.current.get(id);
        if(d) d.inputGain.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05);
    },
    setDeckVolume: (id: DeckId, v: number) => {
        const d = decksRef.current.get(id);
        if(d) d.channelFader.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05);
    },
    setMasterVolume: (v: number) => { 
        resumeContext();
        if(masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(v, audioContextRef.current!.currentTime, 0.05);
    },
    toggleAux1: (id: DeckId) => {
        const d = decksRef.current.get(id);
        if(d) {
          const newVal = d.auxSendGain.gain.value > 0 ? 0 : 1;
          d.auxSendGain.gain.setTargetAtTime(newVal, audioContextRef.current!.currentTime, 0.01);
          return newVal > 0;
        }
        return false;
    },
    toggleAux2: (id: DeckId) => {
        const d = decksRef.current.get(id);
        if(d) {
          const newVal = d.aux2SendGain.gain.value > 0 ? 0 : 1;
          d.aux2SendGain.gain.setTargetAtTime(newVal, audioContextRef.current!.currentTime, 0.01);
          return newVal > 0;
        }
        return false;
    },
    isLimiterActive, toggleLimiter: () => setIsLimiterActive(!isLimiterActive),
    isCompressorActive, toggleCompressor: () => setIsCompressorActive(!isCompressorActive),
    recorders: recState, startRecording, stopRecording, clearRecorder: (id: number) => setRecState(p => p.map(r => r.id === id ? {...r, chunks: [], time: 0} : r)), 
    exportRecording, setFormat: (id: number, f: ExportFormat) => setRecState(p => p.map(r => r.id === id ? {...r, format: f} : r)), 
    setSchedule: (id: number, s: string, e: string) => setRecState(p => p.map(r => r.id === id ? {...r, scheduledStart: s, scheduledEnd: e} : r)),
    setupLiveMic: async (deviceId: string) => {
      resumeContext();
      const ctx = audioContextRef.current; if (!ctx) return;
      const deck = decksRef.current.get('LIVE_MIC'); if (!deck) return;
      if (deck.micStream) deck.micStream.getTracks().forEach(t => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined } });
        const source = ctx.createMediaStreamSource(stream);
        source.connect(deck.inputGain);
        deck.source = source; deck.micStream = stream;
      } catch (err) { console.error("Mic error:", err); }
    }
  };
};
