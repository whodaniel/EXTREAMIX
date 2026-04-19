import { VideoSource } from '../types';
import { extreamixEngine } from './ExtreamixEngine';
import { extreamixMatrix } from './ExtreamixMatrix';

const vsSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform mat3 u_matrix;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  v_texCoord = a_texCoord;
}`;

const fsSource = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_opacity;
uniform float u_pixelSize;
uniform vec2 u_rgbSplitOffset;
uniform vec2 u_resolution;
uniform float u_pulseGate;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec2 texCoord = v_texCoord;
  
  // Pixelation
  if (u_pixelSize > 1.0) {
    vec2 pixel = u_pixelSize / u_resolution;
    texCoord = floor(texCoord / pixel) * pixel;
  }

  // RGB Split
  vec4 r = texture(u_image, texCoord + u_rgbSplitOffset);
  vec4 g = texture(u_image, texCoord);
  vec4 b = texture(u_image, texCoord - u_rgbSplitOffset);
  
  vec4 color = vec4(r.r, g.g, b.b, g.a);
  
  // Apply pulse gate modulation
  float modulation = 1.0 + (u_pulseGate * 0.2);
  outColor = vec4(color.rgb * modulation, color.a * u_opacity);
}`;

function m3_projection(width: number, height: number) {
  return [
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1,
  ];
}

function m3_translate(m: number[], dx: number, dy: number) {
  return [
    m[0], m[1], m[2],
    m[3], m[4], m[5],
    m[0] * dx + m[3] * dy + m[6],
    m[1] * dx + m[4] * dy + m[7],
    m[2] * dx + m[5] * dy + m[8],
  ];
}

function m3_scale(m: number[], sx: number, sy: number) {
  return [
    m[0] * sx, m[1] * sx, m[2] * sx,
    m[3] * sy, m[4] * sy, m[5] * sy,
    m[6], m[7], m[8],
  ];
}

class VideoEngine {
  private sources: Map<string, VideoSource> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private textures: Map<string, WebGLTexture> = new Map();
  private animationId: number | null = null;

  private matrixLocation: WebGLUniformLocation | null = null;
  private opacityLocation: WebGLUniformLocation | null = null;
  private pixelSizeLocation: WebGLUniformLocation | null = null;
  private rgbSplitOffsetLocation: WebGLUniformLocation | null = null;
  private resolutionLocation: WebGLUniformLocation | null = null;
  private imageLocation: WebGLUniformLocation | null = null;
  private pulseGateLocation: WebGLUniformLocation | null = null;

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { alpha: true });
    if (!this.gl) return;
    this.setupWebGL();
    this.startRender();
  }

  private compileShader(type: number, source: string) {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private setupWebGL() {
    const gl = this.gl!;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');

    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix');
    this.opacityLocation = gl.getUniformLocation(this.program, 'u_opacity');
    this.pixelSizeLocation = gl.getUniformLocation(this.program, 'u_pixelSize');
    this.rgbSplitOffsetLocation = gl.getUniformLocation(this.program, 'u_rgbSplitOffset');
    this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    this.imageLocation = gl.getUniformLocation(this.program, 'u_image');
    this.pulseGateLocation = gl.getUniformLocation(this.program, 'u_pulseGate');

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }

  public addSource(stream: MediaStream, name: string): VideoSource {
    const id = `v-${Date.now()}`;
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.play();
    const source: VideoSource = { id, name, stream, videoElement: video, opacity: 1, blendMode: 'source-over', active: true, position: { x: 0, y: 0 }, scale: 1 };
    this.sources.set(id, source);
    return source;
  }

  public removeSource(id: string) {
    const source = this.sources.get(id);
    if (source) {
      source.stream.getTracks().forEach(t => t.stop());
      source.videoElement.pause();
      this.sources.delete(id);
      if (this.gl) {
        const texture = this.textures.get(id);
        if (texture) this.gl.deleteTexture(texture);
      }
    }
  }

  public updateSource(id: string, update: Partial<VideoSource>) {
    const source = this.sources.get(id);
    if (source) Object.assign(source, update);
  }

  private startRender() {
    const render = () => {
      if (!this.gl || !this.canvas || !this.program) {
        this.animationId = requestAnimationFrame(render);
        return;
      }
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.useProgram(this.program);
      gl.bindVertexArray(this.vao);

      const audioCtx = extreamixEngine.getContext();
      const currentTime = audioCtx ? audioCtx.currentTime : 0;
      const pulseGate = extreamixMatrix.getWebGLUniform('u_pulseGate', currentTime);
      gl.uniform1f(this.pulseGateLocation, pulseGate);

      this.sources.forEach(source => {
        if (!source.active) return;
        const vw = source.videoElement.videoWidth;
        const vh = source.videoElement.videoHeight;
        if (vw === 0 || vh === 0) return;

        let texture = this.textures.get(source.id);
        if (!texture) {
          texture = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          this.textures.set(source.id, texture);
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.videoElement);

        if (source.blendMode === 'additive') { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); }
        else if (source.blendMode === 'subtractive') { gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); }
        else { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }

        gl.uniform1f(this.opacityLocation, source.opacity);
        const effects = (source as any).effects || { pixelSize: 1.0, rgbSplit: { x: 0, y: 0 } };
        gl.uniform1f(this.pixelSizeLocation, effects.pixelSize || 1.0);
        gl.uniform2f(this.rgbSplitOffsetLocation, effects.rgbSplit?.x || 0.0, effects.rgbSplit?.y || 0.0);
        gl.uniform2f(this.resolutionLocation, vw, vh);

        const aspect = vw / vh;
        let dw = this.canvas!.width * source.scale;
        let dh = dw / aspect;
        const dx = (this.canvas!.width - dw) / 2 + (source.position.x * this.canvas!.width / 2);
        const dy = (this.canvas!.height - dh) / 2 + (source.position.y * this.canvas!.height / 2);

        let matrix = m3_projection(this.canvas!.width, this.canvas!.height);
        matrix = m3_translate(matrix, dx, dy);
        matrix = m3_scale(matrix, dw, dh);
        gl.uniformMatrix3fv(this.matrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      });
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  public stopRender() { if (this.animationId) cancelAnimationFrame(this.animationId); }
}

export const videoEngine = new VideoEngine();
