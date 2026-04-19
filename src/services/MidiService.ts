import { audioEngine } from './audioEngine';
import { videoEngine } from './videoEngine';

class MidiService {
  private midiAccess: MIDIAccess | null = null;
  private initialized = false;

  public async init() {
    if (this.initialized) return;

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.initialized = true;

      // Handle existing inputs
      this.setupInputs();

      // Handle hot-plugging
      this.midiAccess.onstatechange = (event) => {
        if (event.port.state === 'connected' && event.port.type === 'input') {
          this.setupInputs();
        }
      };

      console.log('MIDI Service initialized successfully');
    } catch (error) {
      console.warn('MIDI Access failed or is not supported:', error);
    }
  }

  private setupInputs() {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      // Avoid attaching multiple listeners if re-evaluated
      input.onmidimessage = this.handleMidiMessage.bind(this);
    });
  }

  private handleMidiMessage(message: MIDIMessageEvent) {
    const { data } = message;
    if (!data || data.length < 3) return;

    const [status, data1, data2] = data;

    // Check if it's a Control Change (CC) message on any channel (176-191)
    if (status >= 176 && status <= 191) {
      this.mapCC(data1, data2);
    }
  }

  private mapCC(cc: number, value: number) {
    // Normalize value from 0-127 to 0.0-1.0
    const normalized = value / 127;

    // Tactical mapping for ExtreamixEngine Matrix Gates and WebGL uniforms
    // Extreamix uses channel ids like 'ch1', 'ch2' - here we apply to commonly expected ones
    switch (cc) {
      // --- Audio Engine Mappings ---
      case 70: // Generic CC for Channel 1 Volume
        audioEngine.updateChannel('ch1', { volume: normalized });
        break;
      case 71: // Generic CC for Channel 1 Pan (-1 to 1)
        audioEngine.updateChannel('ch1', { pan: (normalized * 2) - 1 });
        break;
      case 72: // Generic CC for Channel 1 Low EQ (-20 to 20 approx)
        audioEngine.updateChannel('ch1', { eq: { low: (normalized * 40) - 20, mid: 0, high: 0 } });
        break;
      case 73: // Generic CC for Channel 2 Volume
        audioEngine.updateChannel('ch2', { volume: normalized });
        break;

      // --- Video Engine Mappings ---
      case 74: { // Generic CC to scale all video sources
        const sources = videoEngine.getSources();
        sources.forEach(source => {
          videoEngine.updateSource(source.id, { scale: 0.5 + (normalized * 1.5) }); // scale from 0.5 to 2.0
        });
        break;
      }
      case 75: { // Generic CC to update opacity of all video sources
        const sources = videoEngine.getSources();
        sources.forEach(source => {
          videoEngine.updateSource(source.id, { opacity: normalized });
        });
        break;
      }
      default:
        // Log unmapped CCs for discovery
        // console.log(`Unmapped CC: ${cc}, value: ${value}`);
        break;
    }
  }
}

export const midiService = new MidiService();
