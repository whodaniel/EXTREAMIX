export class DynamicMidiService {
  private activeLearnPromiseResolve: ((cc: number | null) => void) | null = null;
  private activeLearnTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeParamId: string | null = null;
  private midiAccess: WebMidi.MIDIAccess | null = null;
  private mappings: Record<string, number> = {};
  private initialized: boolean = false;

  constructor() {
    this.loadMappings();
  }

  private loadMappings() {
    try {
      const stored = localStorage.getItem('extreamix_midi_mappings');
      if (stored) {
        this.mappings = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load MIDI mappings from localStorage', e);
    }
  }

  public saveMapping(paramId: string, cc: number) {
    this.mappings[paramId] = cc;
    try {
      localStorage.setItem('extreamix_midi_mappings', JSON.stringify(this.mappings));
    } catch (e) {
      console.warn('Failed to save MIDI mappings to localStorage', e);
    }
  }

  public getMapping(paramId: string): number | null {
    return this.mappings[paramId] !== undefined ? this.mappings[paramId] : null;
  }

  public getAllMappings(): Record<string, number> {
    return { ...this.mappings };
  }

  public async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (navigator.requestMIDIAccess) {
        this.midiAccess = await navigator.requestMIDIAccess();

        // Listen to all currently available inputs
        this.midiAccess.inputs.forEach((input) => {
          input.onmidimessage = this.handleMidiMessage.bind(this);
        });

        // Listen for new devices connecting
        this.midiAccess.onstatechange = (e: WebMidi.MIDIConnectionEvent) => {
          if (e.port.type === 'input' && e.port.state === 'connected') {
            const input = e.port as WebMidi.MIDIInput;
            input.onmidimessage = this.handleMidiMessage.bind(this);
          }
        };

        this.initialized = true;
        return true;
      } else {
        console.warn('Web MIDI API is not supported in this browser.');
        return false;
      }
    } catch (err) {
      console.error('Failed to get MIDI access', err);
      return false;
    }
  }

  private handleMidiMessage(event: WebMidi.MIDIMessageEvent) {
    const [status, data1, data2] = event.data;

    // Check if it's a Control Change (CC) message on any channel (176-191)
    if (status >= 176 && status <= 191) {
      const ccNumber = data1;

      // If we are currently in learn mode, resolve the promise with the CC number
      if (this.activeLearnPromiseResolve) {
        console.log(`[MIDI Learn] Bound CC ${ccNumber} to ${this.activeParamId}`);
        this.activeLearnPromiseResolve(ccNumber);
        this.clearLearnState();
      } else {
        // Here we could emit events for active mappings being triggered
        // This is where regular MIDI CC handling would go
      }
    }
  }

  public async engageLearnMode(paramId: string): Promise<number | null> {
    // Ensure MIDI is initialized before trying to learn
    if (!this.initialized) {
      await this.init();
    }

    // Cancel any existing learn mode
    if (this.activeLearnPromiseResolve) {
      this.activeLearnPromiseResolve(null);
      this.clearLearnState();
    }

    this.activeParamId = paramId;

    return new Promise((resolve) => {
      this.activeLearnPromiseResolve = resolve;

      // 5-second timeout
      this.activeLearnTimeout = setTimeout(() => {
        if (this.activeLearnPromiseResolve) {
          console.log(`[MIDI Learn] Timeout for ${this.activeParamId}`);
          this.activeLearnPromiseResolve(null);
          this.clearLearnState();
        }
      }, 5000);
    });
  }

  private clearLearnState() {
    this.activeLearnPromiseResolve = null;
    this.activeParamId = null;
    if (this.activeLearnTimeout) {
      clearTimeout(this.activeLearnTimeout);
      this.activeLearnTimeout = null;
    }
  }
}

export const midiService = new DynamicMidiService();
