
export type DeckId = 'MIC' | 'A' | 'RNE_EMISORAS' | 'C' | 'D' | 'E' | 'F' | 'ES_RADIO' | 'RADIO_MARCA' | 'RADIO_ESPANA';

export type RecorderSource = 'MASTER' | 'AUX1' | 'AUX2';
export type ExportFormat = 'MP3' | 'WEBM' | 'WAV' | 'OGG';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  fileName: string | null;
}

export interface MixMetadata {
  trackA: string;
  trackB: string;
}

export interface EqState {
    low: number;
    mid: number;
    high: number;
    bypass: boolean;
}

export type CrossfaderCurve = 'LINEAR' | 'CONSTANT_POWER' | 'SHARP';
export type CrossfaderAssignment = 'A' | 'B' | 'THRU';

export interface RecorderState {
  id: number;
  isRecording: boolean;
  time: number;
  chunks: Blob[];
  source: RecorderSource;
  format: ExportFormat;
  scheduledStart?: string;
  scheduledEnd?: string;
}
