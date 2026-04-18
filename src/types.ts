export type View = 'mixer' | 'sequencer' | 'routing' | 'library' | 'vision';

export interface Point {
  x: number;
  y: number;
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
  audioChannelId?: string;
}

export interface EQState {
  low: number;
  mid: number;
  high: number;
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
}

export interface SequencerState {
  steps: boolean[];
  bpm: number;
  currentStep: number;
  isPlaying: boolean;
}

export interface RoutingSource {
  id: string;
  name: string;
  active: boolean;
  inputBus: string;
  virtualOut: string;
}
