export class ExtreamixEngine {
  private matrixGates: Map<string, GainNode> = new Map();
  // We keep a timeline of WebGL uniform values
  private uniformEvents: Array<{ time: number; value: number }> = [];

  public registerMatrixGate(id: string, gainNode: GainNode) {
    this.matrixGates.set(id, gainNode);
  }

  public setMatrixGateState(id: string, value: number, time: number) {
    const gate = this.matrixGates.get(id);
    if (gate) {
      gate.gain.setValueAtTime(value, time);
    }
  }

  public setWebGLUniform(name: string, value: number, time: number) {
    if (name !== 'u_pulseGate') return;

    // Insert sorted
    let insertIndex = this.uniformEvents.length;
    while (insertIndex > 0 && this.uniformEvents[insertIndex - 1].time > time) {
      insertIndex--;
    }
    this.uniformEvents.splice(insertIndex, 0, { time, value });

    // Prune old events
    if (this.uniformEvents.length > 100) {
      this.uniformEvents.splice(0, this.uniformEvents.length - 100);
    }
  }

  public getWebGLUniform(name: string, currentTime: number): number {
    if (name !== 'u_pulseGate') return 0.0;

    let lastValue = 0.0;
    for (const event of this.uniformEvents) {
      if (event.time <= currentTime) {
        lastValue = event.value;
      } else {
        break;
      }
    }
    return lastValue;
  }
}

export const extreamixEngine = new ExtreamixEngine();
