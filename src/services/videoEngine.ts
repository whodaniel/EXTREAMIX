import { VideoSource } from '../types';

const vsSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform mat3 u_matrix;
out vec2 v_texCoord;
void main() {
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
  gl_Position = vec4(position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const fsSource = `#version 300 es
precision mediump float;
in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_opacity;
uniform float u_pixelSize;
uniform vec2 u_rgbSplitOffset;
uniform vec2 u_resolution;

out vec4 outColor;
void main() {
  vec2 texCoord = v_texCoord;

  if (u_pixelSize > 1.0 && u_resolution.x > 0.0) {
      vec2 pixels = u_resolution / u_pixelSize;
      texCoord = floor(texCoord * pixels) / pixels;
  }

  float r = texture(u_image, texCoord + u_rgbSplitOffset).r;
  float g = texture(u_image, texCoord).g;
  float b = texture(u_image, texCoord - u_rgbSplitOffset).b;
  float a = texture(u_image, texCoord).a;

  outColor = vec4(r, g, b, a * u_opacity);
}
`;

function m3_projection(width: number, height: number) {
  return [
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1
  ];
}

function m3_multiply(a: number[], b: number[]) {
  const a00 = a[0], a01 = a[1], a02 = a[2];
  const a10 = a[3], a11 = a[4], a12 = a[5];
  const a20 = a[6], a21 = a[7], a22 = a[8];

  const b00 = b[0], b01 = b[1], b02 = b[2];
  const b10 = b[3], b11 = b[4], b12 = b[5];
  const b20 = b[6], b21 = b[7], b22 = b[8];

  return [
    b00 * a00 + b01 * a10 + b02 * a20,
    b00 * a01 + b01 * a11 + b02 * a21,
    b00 * a02 + b01 * a12 + b02 * a22,
    b10 * a00 + b11 * a10 + b12 * a20,
    b10 * a01 + b11 * a11 + b12 * a21,
    b10 * a02 + b11 * a12 + b12 * a22,
    b20 * a00 + b21 * a10 + b22 * a20,
    b20 * a01 + b21 * a11 + b22 * a21,
    b20 * a02 + b21 * a12 + b22 * a22,
  ];
}

function m3_translation(tx: number, ty: number) {
  return [
    1, 0, 0,
    0, 1, 0,
    tx, ty, 1
  ];
}

function m3_scaling(sx: number, sy: number) {
  return [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1
  ];
}

function m3_translate(m: number[], tx: number, ty: number) {
  return m3_multiply(m, m3_translation(tx, ty));
}

function m3_scale(m: number[], sx: number, sy: number) {
  return m3_multiply(m, m3_scaling(sx, sy));
}

class VideoEngine {
  private sources: Map<string, VideoSource> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private animationId: number | null = null;

  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private textures: Map<string, WebGLTexture> = new Map();

  private matrixLocation: WebGLUniformLocation | null = null;
  private opacityLocation: WebGLUniformLocation | null = null;
  private pixelSizeLocation: WebGLUniformLocation | null = null;
  private rgbSplitOffsetLocation: WebGLUniformLocation | null = null;
  private resolutionLocation: WebGLUniformLocation | null = null;
  private imageLocation: WebGLUniformLocation | null = null;

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
    if (!this.gl) {
      console.error("WebGL2 not supported");
      return;
    }
    this.setupWebGL();
    this.startRender();
  }

  private compileShader(type: number, source: string): WebGLShader | null {
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

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
      return;
    }

    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');

    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix');
    this.opacityLocation = gl.getUniformLocation(this.program, 'u_opacity');
    this.pixelSizeLocation = gl.getUniformLocation(this.program, 'u_pixelSize');
    this.rgbSplitOffsetLocation = gl.getUniformLocation(this.program, 'u_rgbSplitOffset');
    this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    this.imageLocation = gl.getUniformLocation(this.program, 'u_image');

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }

  public addSource(stream: MediaStream, name: string): VideoSource {
    const id = `v-${Date.now()}`;
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.play();

    const source: VideoSource = {
      id,
      name,
      stream,
      videoElement: video,
      opacity: 1,
      blendMode: 'source-over',
      active: true,
      position: { x: 0, y: 0 },
      scale: 1
    };

    this.sources.set(id, source);
    return source;
  }

  public removeSource(id: string) {
    const source = this.sources.get(id);
    if (source) {
      source.stream.getTracks().forEach(t => t.stop());
      source.videoElement.pause();
      this.sources.delete(id);

      const texture = this.textures.get(id);
      if (texture && this.gl) {
          this.gl.deleteTexture(texture);
          this.textures.delete(id);
      }
    }
  }

  public updateSource(id: string, update: Partial<VideoSource>) {
    const source = this.sources.get(id);
    if (source) {
      Object.assign(source, update);
    }
  }

  public getSources(): VideoSource[] {
    return Array.from(this.sources.values());
  }

  private startRender() {
    const render = () => {
      if (!this.gl || !this.canvas || !this.program) {
        this.animationId = requestAnimationFrame(render);
        return;
      }

      const gl = this.gl;

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);

      gl.useProgram(this.program);
      gl.bindVertexArray(this.vao);

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
        } else {
            gl.bindTexture(gl.TEXTURE_2D, texture);
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.videoElement);

        const mode = source.blendMode;
        if (mode === 'additive') {
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else if (mode === 'subtractive') {
            gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else {
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        gl.uniform1f(this.opacityLocation, source.opacity);

        const effects = (source as any).effects || { pixelSize: 1.0, rgbSplit: { x: 0, y: 0 } };
        gl.uniform1f(this.pixelSizeLocation, effects.pixelSize || 1.0);
        gl.uniform2f(this.rgbSplitOffsetLocation, effects.rgbSplit?.x || 0.0, effects.rgbSplit?.y || 0.0);
        gl.uniform2f(this.resolutionLocation, vw, vh);

        gl.uniform1i(this.imageLocation, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

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

  public stopRender() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export const videoEngine = new VideoEngine();
