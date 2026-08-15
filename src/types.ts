export type View = 'mixer' | 'filters' | 'routing' | 'library' | 'vision' | 'admin' | 'addons' | 'filter-designer' | 'profile' | 'landing';

export interface Point {
  x: number;
  y: number;
}

export interface CustomVideoFilter {
  id: string;
  name: string;
  shaderCode: string;
}

export interface VideoSource {
  id: string;
  name: string;
  stream: MediaStream;
  videoElement: HTMLVideoElement;
  opacity: number;
  blendMode: string;
  active: boolean;
  position: Point;
  scale: number;
  zIndex: number;
  audioChannelId?: string;
  pulseRouting: string[]; // List of Pulse Track IDs this asset is latched to. Empty means unlatched.
  pulseOpacity: number; // Animated value modulated by the engine.
  customFilterId?: string;
}

export interface EQState {
  low: number;
  mid: number;
  high: number;
}

export interface FXState {
  delay: { active: boolean; time: number; feedback: number; mix: number };
  reverb: { active: boolean; roomSize: number; mix: number };
  chorus: { active: boolean; rate: number; depth: number; mix: number };
  phaser: { active: boolean; rate: number; depth: number; mix: number };
}

export interface ChannelState {
  id: string;
  name: string;
  volume: number;
  pan: number; // For 3D: x-axis
  depth: number; // For 3D: z-axis
  mute: boolean;
  solo: boolean;
  eq: EQState;
  fx: FXState;
  pitchCorrection: number; // 0-1 amount
  beatCorrection: number; // 0-1 amount
  pulseRouting?: string[]; // Optional pulse tracks this channel is latched to
}

export interface PulseTrack {
  id: string;
  name: string;
  steps: boolean[];
  division: number; // Note division: 4 = 1/4 note, 8 = 1/8 note, 16 = 1/16, etc.
  length: number;
  targetFilter?: 'LOW_BAND' | 'MID_BAND' | 'HIGH_BAND' | 'NONE';
}

export interface SequencerState {
  tracks: PulseTrack[];
  bpm: number;
  isPlaying: boolean;
  masterTick: number; // Internal high-resolution tick
  tempoDriftEnabled: boolean;
  tempoDriftThreshold: number;
  masterTempoSourceId?: string; // Channel ID to track for BPM
  masterVolume: number;
  masterFX: FXState;
}

export interface RoutingSource {
  id: string;
  name: string;
  active: boolean;
  type: 'tab' | 'mic' | 'system' | 'generator';
}

export interface RoutingDestination {
  id: string;
  name: string;
}

export interface RoutingConnection {
  sourceId: string;
  destinationId: string;
}

export interface CrossoverState {
  low200: boolean;
  mid1000: boolean;
  high3000: boolean;
}

export interface ShaderUniforms {
  rgbSplit: number;
  pixelation: number;
}

export interface MatrixMapping {
  id: string;
  target: string; // e.g., 'GATE_LOW', 'SHADER_RGB'
  midiCC: number | null;
  value: number; // 0-127 or 0-1
}

export interface RegistryPreset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  lastModified: string;
  patchData: string; // JSON string
}
declare global {
  interface Window {
    extreamixMainStream: MediaStream;
  }
}
