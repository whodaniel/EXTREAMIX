export type MidiControlHandler = (normalizedValue: number, rawValue: number) => void;

class MidiService {
  private midiAccess: any = null;
  private controlMappings: Map<number, MidiControlHandler> = new Map();

  async init() {
    if (navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess();
        const inputs = this.midiAccess.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          input.value.onmidimessage = this.onMidiMessage.bind(this);
        }

        this.midiAccess.onstatechange = (event: any) => {
          const port = event.port;
          if (port.type === 'input' && port.state === 'connected') {
            port.onmidimessage = this.onMidiMessage.bind(this);
          }
        };
        console.log('MIDI Service initialized successfully');
      } catch (err) {
        console.error('Failed to get MIDI access', err);
      }
    } else {
      console.warn('Web MIDI API is not supported in this browser.');
    }
  }

  private onMidiMessage(message: any) {
    if (!message.data) return;
    const [status, data1, data2] = message.data;

    // Control Change (CC) messages are usually 176-191 (0xB0 - 0xBF)
    if (status >= 176 && status <= 191) {
      const ccNumber = data1;
      const value = data2; // 0 to 127
      const normalizedValue = value / 127.0;

      this.executeMapping(ccNumber, normalizedValue, value);
    }
  }

  /**
   * Creates a mapping function that allows physical hardware knobs to directly
   * manipulate ExtreamixEngine Matrix Gates, WebGL uniforms, or other parameters.
   *
   * @param ccNumber The MIDI Control Change number (0-127)
   * @param handler Callback function receiving the normalized (0-1) and raw (0-127) values
   */
  public mapControl(ccNumber: number, handler: MidiControlHandler) {
    this.controlMappings.set(ccNumber, handler);
  }

  public unmapControl(ccNumber: number) {
    this.controlMappings.delete(ccNumber);
  }

  private executeMapping(ccNumber: number, normalizedValue: number, rawValue: number) {
    const handler = this.controlMappings.get(ccNumber);
    if (handler) {
      handler(normalizedValue, rawValue);
    }
  }
}

export const midiService = new MidiService();
