// A fully functional Phase Vocoder algorithm in vanilla JavaScript for AudioWorkletProcessor

const TWO_PI = 2 * Math.PI;

function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;

  const m = Math.log2(n);
  if (m % 1 !== 0) throw new Error("FFT length must be a power of 2");

  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      let tempReal = real[i];
      let tempImag = imag[i];
      real[i] = real[j];
      imag[i] = imag[j];
      real[j] = tempReal;
      imag[j] = tempImag;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < halfSize; k++) {
        const angle = -TWO_PI * k / size;
        const wReal = Math.cos(angle);
        const wImag = Math.sin(angle);

        const evenReal = real[i + k];
        const evenImag = imag[i + k];

        const oddReal = real[i + k + halfSize];
        const oddImag = imag[i + k + halfSize];

        const tReal = wReal * oddReal - wImag * oddImag;
        const tImag = wReal * oddImag + wImag * oddReal;

        real[i + k] = evenReal + tReal;
        imag[i + k] = evenImag + tImag;

        real[i + k + halfSize] = evenReal - tReal;
        imag[i + k + halfSize] = evenImag - tImag;
      }
    }
  }
}

function ifft(real, imag) {
  const n = real.length;
  for (let i = 0; i < n; i++) {
    imag[i] = -imag[i];
  }
  fft(real, imag);
  for (let i = 0; i < n; i++) {
    real[i] /= n;
    imag[i] = -imag[i] / n;
  }
}

const FFT_SIZE = 1024;
const HOP_SIZE = 256;
const OMEGA = new Float32Array(FFT_SIZE / 2 + 1);
for (let i = 0; i <= FFT_SIZE / 2; i++) {
  OMEGA[i] = TWO_PI * HOP_SIZE * i / FFT_SIZE;
}

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pitchRatio = 1.0;

    this.inBuffer = new Float32Array(FFT_SIZE);
    this.outBuffer = new Float32Array(FFT_SIZE);
    this.inBufferWritePos = 0;

    this.window = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((TWO_PI * i) / (FFT_SIZE - 1)));
    }

    this.lastPhase = new Float32Array(FFT_SIZE / 2 + 1);
    this.sumPhase = new Float32Array(FFT_SIZE / 2 + 1);

    this.fftReal = new Float32Array(FFT_SIZE);
    this.fftImag = new Float32Array(FFT_SIZE);
    this.synthReal = new Float32Array(FFT_SIZE);
    this.synthImag = new Float32Array(FFT_SIZE);

    // Using a ring buffer for Overlap-Add to handle block processing correctly
    // Output overlap-add buffer needs to be long enough to hold the decaying tails
    this.olaBuffer = new Float32Array(FFT_SIZE);
    this.olaReadPos = 0;

    // We accumulate samples until we reach HOP_SIZE
    this.samplesAccumulated = 0;
  }

  static get parameterDescriptors() {
    return [{
      name: 'pitchRatio',
      defaultValue: 1.0,
      minValue: 0.5,
      maxValue: 2.0
    }];
  }

  processFrame() {
    // Apply window to input frame and copy to FFT input
    for (let i = 0; i < FFT_SIZE; i++) {
      this.fftReal[i] = this.inBuffer[i] * this.window[i];
      this.fftImag[i] = 0;
    }

    // Perform FFT
    fft(this.fftReal, this.fftImag);

    // Phase Vocoder Analysis and Processing
    const numBins = FFT_SIZE / 2 + 1;
    const mag = new Float32Array(numBins);
    const phase = new Float32Array(numBins);

    // Calculate magnitude and true frequency
    for (let k = 0; k < numBins; k++) {
      const re = this.fftReal[k];
      const im = this.fftImag[k];

      mag[k] = Math.sqrt(re * re + im * im);
      phase[k] = Math.atan2(im, re);

      // Phase difference
      let dp = phase[k] - this.lastPhase[k];
      this.lastPhase[k] = phase[k];

      // Subtract expected phase difference
      dp -= OMEGA[k];

      // Wrap phase into [-pi, pi]
      dp = dp - TWO_PI * Math.round(dp / TWO_PI);

      // True frequency in rads/hop
      const trueFreq = OMEGA[k] + dp;

      // Accumulate phase
      this.sumPhase[k] += trueFreq * this.pitchRatio;
    }

    // Synthesis arrays
    this.synthReal.fill(0);
    this.synthImag.fill(0);

    // Resample/Shift bins
    for (let k = 0; k < numBins; k++) {
      const newBin = Math.floor(k * this.pitchRatio + 0.5);
      if (newBin < numBins) {
        const amplitude = mag[k];
        const outPhase = this.sumPhase[k];

        this.synthReal[newBin] += amplitude * Math.cos(outPhase);
        this.synthImag[newBin] += amplitude * Math.sin(outPhase);
      }
    }

    // Mirror spectrum for IFFT
    for (let k = 1; k < FFT_SIZE / 2; k++) {
      this.synthReal[FFT_SIZE - k] = this.synthReal[k];
      this.synthImag[FFT_SIZE - k] = -this.synthImag[k];
    }

    // Perform IFFT
    ifft(this.synthReal, this.synthImag);

    // Overlap-Add
    // The synthReal array now contains the output time-domain frame
    // We add it to our OLA buffer with the window applied again
    for (let i = 0; i < FFT_SIZE; i++) {
      const index = (this.olaReadPos + i) % FFT_SIZE;
      this.olaBuffer[index] += this.synthReal[i] * this.window[i]; // Apply synthesis window
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0 || !input[0]) return true;

    const pitchRatioParam = parameters.pitchRatio;
    this.pitchRatio = pitchRatioParam.length > 1 ? pitchRatioParam[0] : pitchRatioParam[0];

    const inChannel = input[0];
    const numFrames = inChannel.length; // Usually 128

    // We process sample by sample
    for (let i = 0; i < numFrames; i++) {
      // 1. Shift input buffer by 1 and add new sample
      for (let j = 0; j < FFT_SIZE - 1; j++) {
        this.inBuffer[j] = this.inBuffer[j + 1];
      }
      this.inBuffer[FFT_SIZE - 1] = inChannel[i];

      this.samplesAccumulated++;

      // 2. Output sample from OLA buffer
      let outSample = this.olaBuffer[this.olaReadPos] * 1.5; // Gain compensation
      this.olaBuffer[this.olaReadPos] = 0; // Clear after reading

      this.olaReadPos = (this.olaReadPos + 1) % FFT_SIZE;

      // Copy to all output channels
      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = outSample;
      }

      // 3. Trigger Phase Vocoder frame processing when hop size is reached
      if (this.samplesAccumulated >= HOP_SIZE) {
        this.processFrame();
        this.samplesAccumulated = 0;
      }
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
