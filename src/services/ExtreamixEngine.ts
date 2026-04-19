import { ChannelState } from '../types';

class ExtreamixEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private channels: Map<string, { 
    gain: GainNode; 
    panner: PannerNode; 
    analyser: AnalyserNode;
    eqLow: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqHigh: BiquadFilterNode;
    spectralCrossover?: BiquadFilterNode;
  }> = new Map();
  private activeStreamSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  
  // Sequencer state
  private timerID: number | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private lookahead: number = 25.0;
  private scheduleAheadTime: number = 0.1;

  public onStep: (step: number) => void = () => {};

  public init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    // Configure as brickwall limiter
    this.masterLimiter.ratio.value = 20;
    this.masterLimiter.attack.value = 0.001;
    this.masterLimiter.knee.value = 0;
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.release.value = 0.1;

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.masterLimiter);
    this.masterLimiter.connect(this.ctx.destination);
  }

  public getContext() {
    return this.ctx;
  }

  public getMasterAnalyser() {
    return this.masterAnalyser;
  }

  public createChannel(id: string, initialState: ChannelState) {
    if (!this.ctx || !this.masterGain) return;
    
    const gain = this.ctx.createGain();
    gain.gain.value = initialState.volume;
    
    // EQ Chain
    const eqLow = this.ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 320;
    eqLow.gain.value = initialState.eq?.low || 0;

    const eqMid = this.ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1.0;
    eqMid.gain.value = initialState.eq?.mid || 0;

    const eqHigh = this.ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3200;
    eqHigh.gain.value = initialState.eq?.high || 0;

    // 3D Panner
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.positionX.value = initialState.pan; // left-right
    panner.positionY.value = 0;
    panner.positionZ.value = initialState.depth || 0; // front-back (depth)
    
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 64;
    
    // Connect Chain: Source -> eqLow -> eqMid -> eqHigh -> Gain -> Panner -> Analyser -> Master
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(gain);
    gain.connect(panner);
    panner.connect(analyser);
    analyser.connect(this.masterGain);
    
    this.channels.set(id, { gain, panner, analyser, eqLow, eqMid, eqHigh });
  }

  public updateChannel(id: string, state: Partial<ChannelState>) {
    const channel = this.channels.get(id);
    if (!channel || !this.ctx) return;
    
    if (state.volume !== undefined) {
      channel.gain.gain.setTargetAtTime(state.mute ? 0 : state.volume, this.ctx.currentTime, 0.02);
    }
    if (state.pan !== undefined) {
      channel.panner.positionX.setTargetAtTime(state.pan * 2, this.ctx.currentTime, 0.02);
    }
    if (state.depth !== undefined) {
      channel.panner.positionZ.setTargetAtTime(state.depth * 2, this.ctx.currentTime, 0.02);
    }
    if (state.eq) {
      if (state.eq.low !== undefined) channel.eqLow.gain.setTargetAtTime(state.eq.low, this.ctx.currentTime, 0.02);
      if (state.eq.mid !== undefined) channel.eqMid.gain.setTargetAtTime(state.eq.mid, this.ctx.currentTime, 0.02);
      if (state.eq.high !== undefined) channel.eqHigh.gain.setTargetAtTime(state.eq.high, this.ctx.currentTime, 0.02);
    }
  }

  public routeStreamToChannel(stream: MediaStream, channelId: string, sourceId?: string) {
    if (!this.ctx) return;
    const channel = this.channels.get(channelId);
    if (!channel) return;
    
    // If we have a sourceId, we can manage the re-routing more effectively
    if (sourceId) {
      const existing = this.activeStreamSources.get(sourceId);
      if (existing) {
        existing.disconnect();
        this.activeStreamSources.delete(sourceId);
      }
    }
    
    try {
      if (stream.getAudioTracks().length === 0) return;
      
      const source = this.ctx.createMediaStreamSource(stream);
      source.connect(channel.gain);
      
      if (sourceId) {
        this.activeStreamSources.set(sourceId, source);
      }
      
      console.log(`Routed stream to channel ${channelId}`);
      return source;
    } catch (err) {
      console.error('Failed to route stream:', err);
    }
  }

  public getChannelAnalyser(id: string) {
    return this.channels.get(id)?.analyser;
  }

  public playSynth(time: number, freq: number = 55) {
    if (!this.ctx) return;
    const channel = this.channels.get('v-synth');
    if (!channel) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);
    filter.Q.value = 5;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.6, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(filter);
    filter.connect(env);
    env.connect(channel.gain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  public startSequencer(bpm: number, sequence: boolean[]) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.current16thNote = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler(bpm, sequence);
  }

  public stopSequencer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler(bpm: number, sequence: boolean[]) {
    if (!this.ctx) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime, sequence);
      this.advanceNote(bpm);
    }
    this.timerID = window.setTimeout(() => this.scheduler(bpm, sequence), this.lookahead);
  }

  private scheduleNote(beatNumber: number, time: number, sequence: boolean[]) {
    this.onStep(beatNumber);
    if (sequence[beatNumber]) {
      const rootFreq = 55.0;
      const intervals = [0, 12, 7, 0, 3, 12, 7, 10];
      const freq = rootFreq * Math.pow(1.05946, intervals[beatNumber % 8]);
      this.playSynth(time, freq);
    }
  }

  private advanceNote(bpm: number) {
    const secondsPerBeat = 60.0 / bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }
}

export const extreamixEngine = new ExtreamixEngine();
