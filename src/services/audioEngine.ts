import { ChannelState, PulseTrack, FXState } from '../types';

interface ChannelNodes { 
  gain: GainNode; 
  pulseGate: GainNode;
  panner: PannerNode; 
  analyser: AnalyserNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  delay: DelayNode;
  delayGain: GainNode;
  reverb: ConvolverNode;
  reverbGain: GainNode;
  chorus: DelayNode;
  chorusLFO: OscillatorNode;
  chorusGain: GainNode;
  phaser: BiquadFilterNode[]; // Chain of all-pass filters
  phaserLFO: OscillatorNode;
  phaserGain: GainNode;
  spectralCrossover?: BiquadFilterNode;
  pulseRouting: string[];
  pitchCorrection: number;
  beatCorrection: number;
  osc?: OscillatorNode;
}

interface MasterFXNodes {
  delay: DelayNode;
  delayGain: GainNode;
  reverb: ConvolverNode;
  reverbGain: GainNode;
  chorus: DelayNode;
  chorusLFO: OscillatorNode;
  chorusGain: GainNode;
  phaser: BiquadFilterNode[];
  phaserLFO: OscillatorNode;
  phaserGain: GainNode;
  lowPass: BiquadFilterNode;
  midPass: BiquadFilterNode;
  highPass: BiquadFilterNode;
  masterFilter: BiquadFilterNode; // For master sweeps
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterFX: MasterFXNodes | null = null;
  private channels: Map<string, ChannelNodes> = new Map();
  private activeStreamSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  
  private trackStates: Map<string, { currentStep: number, nextNoteTime: number }> = new Map();
  private tracks: PulseTrack[] = [];
  private bpm: number = 120;
  private tempoDriftEnabled: boolean = false;
  private tempoDriftThreshold: number = 40;
  private masterTempoSourceId?: string;
  private lastTransientTime: number = 0;
  private detectedBPM: number = 120;
  
  // Sequencer state
  private timerID: number | null = null;
  private lookahead: number = 25.0;
  private scheduleAheadTime: number = 0.1;

  public onStep: (trackId: string, step: number, isActive: boolean) => void = () => {};
  public onBpmChange?: (bpm: number) => void;
  public onLimiterActive?: (active: boolean) => void;

  public setTempoDriftThreshold(v: number) {
    this.tempoDriftThreshold = v;
  }

  public init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    // Master FX
    const m_delay = this.ctx.createDelay(2.0);
    const m_delayGain = this.ctx.createGain();
    const m_delayFB = this.ctx.createGain();
    m_delayFB.gain.value = 0.4;
    m_delay.connect(m_delayFB);
    m_delayFB.connect(m_delay);

    const m_chorus = this.ctx.createDelay(0.1);
    const m_chorusLFO = this.ctx.createOscillator();
    const m_chorusLFOGain = this.ctx.createGain();
    const m_chorusGain = this.ctx.createGain();
    m_chorusLFO.frequency.value = 0.3;
    m_chorusLFOGain.gain.value = 0.002;
    m_chorusLFO.connect(m_chorusLFOGain);
    m_chorusLFOGain.connect(m_chorus.delayTime);
    m_chorusLFO.start();

    const m_phaserLFO = this.ctx.createOscillator();
    const m_phaserLFOGain = this.ctx.createGain();
    const m_phaserGain = this.ctx.createGain();
    const m_phaserStages: BiquadFilterNode[] = [];
    m_phaserLFO.frequency.value = 0.2;
    m_phaserLFOGain.gain.value = 500;
    m_phaserLFO.connect(m_phaserLFOGain);
    for(let i=0; i<6; i++) {
      const stage = this.ctx.createBiquadFilter();
      stage.type = 'allpass';
      stage.frequency.value = 1000;
      m_phaserLFOGain.connect(stage.frequency);
      m_phaserStages.push(stage);
    }
    m_phaserLFO.start();

    const m_reverb = this.ctx.createConvolver();
    const m_reverbGain = this.ctx.createGain();
    const m_sampleRate = this.ctx.sampleRate;
    const m_length = m_sampleRate * 3;
    const m_impulse = this.ctx.createBuffer(2, m_length, m_sampleRate);
    for(let i=0; i<m_length; i++) {
      const n = (m_length - i) / m_length;
      m_impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * Math.pow(n, 3);
      m_impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * Math.pow(n, 3);
    }
    m_reverb.buffer = m_impulse;

    const m_lowPass = this.ctx.createBiquadFilter();
    m_lowPass.type = 'lowpass';
    m_lowPass.frequency.value = 200;
    
    const m_midPassLow = this.ctx.createBiquadFilter();
    m_midPassLow.type = 'highpass';
    m_midPassLow.frequency.value = 200;
    const m_midPassHigh = this.ctx.createBiquadFilter();
    m_midPassHigh.type = 'lowpass';
    m_midPassHigh.frequency.value = 3000;
    
    const m_highPass = this.ctx.createBiquadFilter();
    m_highPass.type = 'highpass';
    m_highPass.frequency.value = 3000;

    const m_masterFilter = this.ctx.createBiquadFilter();
    m_masterFilter.type = 'lowpass';
    m_masterFilter.frequency.value = 20000;

    this.masterFX = {
      delay: m_delay, delayGain: m_delayGain,
      reverb: m_reverb, reverbGain: m_reverbGain,
      chorus: m_chorus, chorusLFO: m_chorusLFO, chorusGain: m_chorusGain,
      phaser: m_phaserStages, phaserLFO: m_phaserLFO, phaserGain: m_phaserGain,
      lowPass: m_lowPass,
      midPass: m_midPassHigh, // placeholder for mid chain
      highPass: m_highPass,
      masterFilter: m_masterFilter
    };

    // Connections: MasterGain -> (Parallel Master FX) -> MasterFilter -> (Split Bands) -> Selector -> MasterLimiter
    // For simplicity, we'll route into a sum, then split
    const masterSum = this.ctx.createGain();
	this.masterGain.connect(masterSum);
	m_delayGain.connect(masterSum);
	m_reverbGain.connect(masterSum);
	m_phaserGain.connect(masterSum);
	m_chorusGain.connect(masterSum);

	masterSum.connect(m_masterFilter);

	// Split for Crossover Gates (Spectral)
	const m_lowGate = this.ctx.createGain();
	const m_midGate = this.ctx.createGain();
	const m_highGate = this.ctx.createGain();

	this.masterLimiter = this.ctx.createDynamicsCompressor();
	this.masterLimiter.threshold.setValueAtTime(-0.5, this.ctx.currentTime);
	this.masterLimiter.knee.setValueAtTime(0, this.ctx.currentTime);
	this.masterLimiter.ratio.setValueAtTime(20, this.ctx.currentTime);
	this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
	this.masterLimiter.release.setValueAtTime(0.05, this.ctx.currentTime);

	// Spectral Crossover Routing (All signals pass through masterFilter first)
	m_masterFilter.connect(m_lowPass);
	m_lowPass.connect(m_lowGate);
	m_lowGate.connect(this.masterLimiter);

	m_masterFilter.connect(m_midPassLow);
	m_midPassLow.connect(m_midPassHigh);
	m_midPassHigh.connect(m_midGate);
	m_midGate.connect(this.masterLimiter);

	m_masterFilter.connect(m_highPass);
	m_highPass.connect(m_highGate);
	m_highGate.connect(this.masterLimiter);

	(this.masterFX as any).lowGate = m_lowGate;
	(this.masterFX as any).midGate = m_midGate;
	(this.masterFX as any).highGate = m_highGate;

	this.masterAnalyser = this.ctx.createAnalyser();
	this.masterAnalyser.fftSize = 256;

	this.masterLimiter.connect(this.masterAnalyser);
	this.masterAnalyser.connect(this.ctx.destination);

    const checkLimiter = () => {
      if (this.masterLimiter && this.onLimiterActive) {
        this.onLimiterActive(this.masterLimiter.reduction < -0.1);
      }
      requestAnimationFrame(checkLimiter);
    };
    checkLimiter();
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

    const pulseGate = this.ctx.createGain();
    pulseGate.gain.value = (initialState.pulseRouting && initialState.pulseRouting.length > 0) ? 0 : 1;
    
    // FX Nodes
    const delay = this.ctx.createDelay(2.0);
    const delayGain = this.ctx.createGain();
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.value = 0.5;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay); // Loop

    const chorus = this.ctx.createDelay(0.1);
    const chorusLFO = this.ctx.createOscillator();
    const chorusLFOGain = this.ctx.createGain();
    const chorusGain = this.ctx.createGain();
    chorusLFO.frequency.value = 0.5;
    chorusLFOGain.gain.value = 0.002;
    chorusLFO.connect(chorusLFOGain);
    chorusLFOGain.connect(chorus.delayTime);
    chorusLFO.start();

    const phaserLFO = this.ctx.createOscillator();
    const phaserLFOGain = this.ctx.createGain();
    const phaserGain = this.ctx.createGain();
    const phaserStages: BiquadFilterNode[] = [];
    phaserLFO.frequency.value = 0.5;
    phaserLFOGain.gain.value = 500;
    phaserLFO.connect(phaserLFOGain);
    for(let i=0; i<4; i++) {
      const stage = this.ctx.createBiquadFilter();
      stage.type = 'allpass';
      stage.frequency.value = 1000;
      phaserLFOGain.connect(stage.frequency);
      phaserStages.push(stage);
    }
    phaserLFO.start();

    const reverb = this.ctx.createConvolver();
    const reverbGain = this.ctx.createGain();
    // Generate simple impulse response
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    for(let i=0; i<length; i++) {
      const n = (length - i) / length;
      impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * Math.pow(n, 2);
      impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * Math.pow(n, 2);
    }
    reverb.buffer = impulse;
    
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
    panner.positionX.value = initialState.pan; 
    panner.positionY.value = 0;
    panner.positionZ.value = initialState.depth || 0;
    
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 64;
    
    // Connections: Source -> PulseGate -> (Parallel FX) -> EQ -> Gain -> Panner -> Analyser -> Master
    // For simplicity, we'll connect FX in parallel to the main dry signal
    pulseGate.connect(eqLow);
    
    // Delay dry/wet
    pulseGate.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(eqLow);

    // Chorus
    pulseGate.connect(chorus);
    chorus.connect(chorusGain);
    chorusGain.connect(eqLow);

    // Phaser
    let lastPhaser = pulseGate as AudioNode;
    phaserStages.forEach(s => { lastPhaser.connect(s); lastPhaser = s; });
    lastPhaser.connect(phaserGain);
    phaserGain.connect(eqLow);

    // Reverb
    pulseGate.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(eqLow);

    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(gain);
    gain.connect(panner);
    panner.connect(analyser);
    analyser.connect(this.masterGain);
    
    this.channels.set(id, { 
      gain, 
      pulseGate,
      panner, 
      analyser, 
      eqLow, 
      eqMid, 
      eqHigh,
      delay,
      delayGain,
      reverb,
      reverbGain,
      chorus,
      chorusLFO,
      chorusGain,
      phaser: phaserStages,
      phaserLFO,
      phaserGain,
      pulseRouting: initialState.pulseRouting || [],
      pitchCorrection: initialState.pitchCorrection || 0,
      beatCorrection: initialState.beatCorrection || 0
    });
  }

  public setMasterVolume(v: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  public updateMasterFX(state: FXState) {
    if (!this.masterFX || !this.ctx) return;
    const { delay, reverb, chorus, phaser } = state;
    
    if (delay) {
      this.masterFX.delay.delayTime.setTargetAtTime(delay.time, this.ctx.currentTime, 0.05);
      this.masterFX.delayGain.gain.setTargetAtTime(delay.active ? delay.mix : 0, this.ctx.currentTime, 0.05);
    }
    if (reverb) {
      this.masterFX.reverbGain.gain.setTargetAtTime(reverb.active ? reverb.mix : 0, this.ctx.currentTime, 0.05);
    }
    if (chorus) {
      this.masterFX.chorusLFO.frequency.setTargetAtTime(chorus.rate * 5, this.ctx.currentTime, 0.05);
      this.masterFX.chorusGain.gain.setTargetAtTime(chorus.active ? chorus.mix : 0, this.ctx.currentTime, 0.05);
    }
    if (phaser) {
      this.masterFX.phaserLFO.frequency.setTargetAtTime(phaser.rate * 5, this.ctx.currentTime, 0.05);
      this.masterFX.phaserGain.gain.setTargetAtTime(phaser.active ? phaser.mix : 0, this.ctx.currentTime, 0.05);
    }
  }

  public updateCrossover(state: { low200: boolean, mid1000: boolean, high3000: boolean }) {
    if (!this.masterFX || !this.ctx) return;
    const mfx = this.masterFX as any;
    mfx.lowGate.gain.setTargetAtTime(state.low200 ? 1 : 0, this.ctx.currentTime, 0.02);
    mfx.midGate.gain.setTargetAtTime(state.mid1000 ? 1 : 0, this.ctx.currentTime, 0.02);
    mfx.highGate.gain.setTargetAtTime(state.high3000 ? 1 : 0, this.ctx.currentTime, 0.02);
  }

  public setMasterFilter(freq: number, type: BiquadFilterType = 'lowpass') {
    if (!this.masterFX || !this.ctx) return;
    this.masterFX.masterFilter.type = type;
    this.masterFX.masterFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
  }

  public updateChannel(id: string, state: Partial<ChannelState>) {
    const channel = this.channels.get(id);
    if (!channel || !this.ctx) return;
    
    if (state.volume !== undefined) {
      channel.gain.gain.setTargetAtTime(state.mute ? 0 : state.volume, this.ctx.currentTime, 0.02);
    }
    if (state.pulseRouting !== undefined) {
      channel.pulseRouting = state.pulseRouting;
      const targetGain = state.pulseRouting.length === 0 ? 1 : 0;
      channel.pulseGate.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.01);
    }
    if (state.fx) {
      const { delay, reverb, chorus, phaser } = state.fx;
      if (delay) {
        channel.delay.delayTime.setTargetAtTime(delay.time, this.ctx.currentTime, 0.05);
        channel.delayGain.gain.setTargetAtTime(delay.active ? delay.mix : 0, this.ctx.currentTime, 0.05);
      }
      if (reverb) {
        channel.reverbGain.gain.setTargetAtTime(reverb.active ? reverb.mix : 0, this.ctx.currentTime, 0.05);
      }
      if (chorus) {
        channel.chorusLFO.frequency.setTargetAtTime(chorus.rate * 5, this.ctx.currentTime, 0.05);
        channel.chorusGain.gain.setTargetAtTime(chorus.active ? chorus.mix : 0, this.ctx.currentTime, 0.05);
      }
      if (phaser) {
        channel.phaserLFO.frequency.setTargetAtTime(phaser.rate * 5, this.ctx.currentTime, 0.05);
        channel.phaserGain.gain.setTargetAtTime(phaser.active ? phaser.mix : 0, this.ctx.currentTime, 0.05);
      }
    }

    if (state.pitchCorrection !== undefined) channel.pitchCorrection = state.pitchCorrection;
    if (state.beatCorrection !== undefined) channel.beatCorrection = state.beatCorrection;

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
      source.connect(channel.pulseGate);
      
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

  public startSequencer(bpm: number, tracks: PulseTrack[], tempoDriftEnabled?: boolean, masterTempoSourceId?: string) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.tracks = tracks;
    this.bpm = bpm;
    this.tempoDriftEnabled = tempoDriftEnabled || false;
    this.masterTempoSourceId = masterTempoSourceId;
    this.trackStates.clear();
    
    const startTime = this.ctx.currentTime + 0.05;
    tracks.forEach(track => {
      this.trackStates.set(track.id, {
        currentStep: 0,
        nextNoteTime: startTime
      });
    });
    
    this.scheduler(bpm);
  }

  public stopSequencer() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  private scheduler(bpm: number) {
    if (!this.ctx) return;
    
    // Tempo Drift Logic
    if (this.tempoDriftEnabled && this.masterTempoSourceId) {
      const channel = this.channels.get(this.masterTempoSourceId);
      if (channel) {
        const buffer = new Uint8Array(channel.analyser.frequencyBinCount);
        channel.analyser.getByteTimeDomainData(buffer);
        let max = 0;
        for(let i=0; i<buffer.length; i++) {
          const v = Math.abs(buffer[i] - 128);
          if (v > max) max = v;
        }
        
        // Simple peak detector for "transients" to sync BPM
        if (max > this.tempoDriftThreshold && (this.ctx.currentTime - this.lastTransientTime) > 0.25) {
          const interval = this.ctx.currentTime - this.lastTransientTime;
          this.detectedBPM = 60 / interval;
          // Smooth the drift - allow more sensitivity based on threshold
          const weight = 0.1; // More responsive
          this.bpm = this.bpm * (1 - weight) + this.detectedBPM * weight;
          this.lastTransientTime = this.ctx.currentTime;
          if (this.onBpmChange) {
            this.onBpmChange(Math.round(this.bpm));
          }
        }
      }
    }

    let hasScheduledAnything = false;

    this.tracks.forEach(track => {
      const state = this.trackStates.get(track.id);
      if (!state) return;

      while (state.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(track, state.currentStep, state.nextNoteTime);
        this.advanceNote(bpm, track, state);
        hasScheduledAnything = true;
      }
    });

    this.timerID = window.setTimeout(() => this.scheduler(this.bpm), this.lookahead);
  }

  private scheduleNote(track: PulseTrack, step: number, time: number) {
    const isActive = track.steps[step];
    this.onStep(track.id, step, isActive);
    
    if (isActive) {
      // Audio Gating: find channels latched to this track
      const secondsPerBeat = 60.0 / this.bpm;
      const beatsPerStep = 4 / track.division;
      const duration = beatsPerStep * secondsPerBeat;

      this.channels.forEach(ch => {
        if (ch.pulseRouting.includes(track.id)) {
          // Trigger Gate with Beat Correction Scaling
          const g = ch.pulseGate.gain;
          const correction = ch.beatCorrection ?? 0;
          const attack = 0.002 + (1 - correction) * 0.05;
          const release = 0.002 + (1 - correction) * 0.05;

          g.setValueAtTime(0, time);
          g.linearRampToValueAtTime(1, time + attack);
          g.setValueAtTime(1, Math.max(time + attack, time + duration - release));
          g.linearRampToValueAtTime(0, time + duration);
          
          // Pitch Correction (Internal Synth only)
          if (ch.osc) {
             const cents = (ch.pitchCorrection ?? 0) * 100;
             ch.osc.detune.setTargetAtTime(cents, time, 0.05);
          }
        }
      });

      // Internal Synth play
      const rootFreq = 55.0;
      const intervals = [0, 12, 7, 0, 3, 12, 7, 10];
      const freq = rootFreq * Math.pow(1.05946, intervals[step % intervals.length]);
      // Vary base frequency if we have multiple tracks
      const tFreq = freq * (1 + (parseInt(track.id.replace(/\D/g,'')) % 3) * 0.5);
      this.playSynth(time, isNaN(tFreq) ? freq : tFreq);
    }
  }

  private advanceNote(bpm: number, track: PulseTrack, state: { currentStep: number, nextNoteTime: number }) {
    const secondsPerBeat = 60.0 / bpm;
    // Division: 4 = 1/4 note (1 beat), 8 = 1/8 note (0.5 beats), 16 = 1/16 note (0.25 beats)
    const beatsPerStep = 4 / track.division;
    state.nextNoteTime += beatsPerStep * secondsPerBeat;
    state.currentStep = (state.currentStep + 1) % track.length;
  }
}

export const audioEngine = new AudioEngine();
