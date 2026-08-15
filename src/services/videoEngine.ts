import { VideoSource, CustomVideoFilter } from '../types';

class VideoFilterEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private programMap: Map<string, WebGLProgram> = new Map();
  private texture: WebGLTexture | null = null;
  private lastStream: MediaStream | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl', { premultipliedAlpha: false });
    this.initGeometry();
  }

  private initGeometry() {
    if (!this.gl) return;
    const gl = this.gl;
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0, 0.0, 1.0,
       1.0, -1.0, 1.0, 1.0,
      -1.0,  1.0, 0.0, 0.0,
       1.0,  1.0, 1.0, 0.0
    ]), gl.STATIC_DRAW);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  private compileShader(fsSource: string): WebGLProgram | null {
    if (!this.gl) return null;
    const gl = this.gl;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs));
      return null;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }

  public processFrame(videoEl: HTMLVideoElement, shaderCode: string, timeSeconds: number): HTMLCanvasElement {
    if (!this.gl || videoEl.readyState < 2) return this.canvas;
    const gl = this.gl;

    if (this.canvas.width !== videoEl.videoWidth || this.canvas.height !== videoEl.videoHeight) {
      this.canvas.width = videoEl.videoWidth;
      this.canvas.height = videoEl.videoHeight;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // Hash or use raw code as key
    let program = this.programMap.get(shaderCode);
    if (!program) {
      program = this.compileShader(shaderCode);
      if (program) this.programMap.set(shaderCode, program);
    }
    if (!program) return this.canvas;

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);

    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoEl);

    const timeLoc = gl.getUniformLocation(program, "u_time");
    if (timeLoc) gl.uniform1f(timeLoc, timeSeconds);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return this.canvas;
  }
}

class VideoEngine {
  private sources: Map<string, VideoSource> = new Map();
  private sortedSourcesCache: VideoSource[] = [];
  private needsSort: boolean = true;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  private filterEngine = new VideoFilterEngine();
  private customFiltersMap: Map<string, CustomVideoFilter> = new Map();
  private engineStartTime = Date.now();
  
  public setCustomFilters(filters: CustomVideoFilter[]) {
    this.customFiltersMap.clear();
    filters.forEach(f => this.customFiltersMap.set(f.id, f));
  }

  
  private isDragging = false;
  private isResizing = false;
  private draggedSourceId: string | null = null;
  private lastMouse: { x: number, y: number } = { x: 0, y: 0 };
  private isZKeyHeld = false;
  
  public onUpdateSource?: (id: string, update: Partial<VideoSource>) => void;
  public onSelectSource?: (id: string) => void;

  public init(canvas: HTMLCanvasElement) {
    if (this.animationId) this.stopRender();
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.startRender();
    this.attachEvents();
  }

  private attachEvents() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', this.handleStart);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
    window.addEventListener('touchmove', this.handleMove, { passive: false });
    window.addEventListener('touchend', this.handleEnd);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'z' || e.key === 'Z') this.isZKeyHeld = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'z' || e.key === 'Z') this.isZKeyHeld = false;
  };

  private getEventPoint(e: MouseEvent | TouchEvent) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e && window.TouchEvent && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    const x = (clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (clientY - rect.top) * (this.canvas.height / rect.height);
    return { x, y };
  }

  private getInteraction(x: number, y: number): { id: string, type: 'drag' | 'resize' } | null {
    if (!this.canvas) return null;
    if (this.needsSort) {
      this.sortedSourcesCache = Array.from(this.sources.values()).sort((a, b) => a.zIndex - b.zIndex);
      this.needsSort = false;
    }
    const sourcesArr = [...this.sortedSourcesCache].reverse();
    for (const source of sourcesArr) {
      if (!source.active) continue;
      const vw = source.videoElement.videoWidth;
      const vh = source.videoElement.videoHeight;
      if (vw === 0 || vh === 0) continue;
      
      const aspect = vw / vh;
      let dw = this.canvas.width * source.scale;
      let dh = dw / aspect;
      
      const dx = (this.canvas.width - dw) / 2 + (source.position.x * this.canvas.width / 2);
      const dy = (this.canvas.height - dh) / 2 + (source.position.y * this.canvas.height / 2);
      
      // Resize handle (bottom right)
      const handleSize = 40;
      if (x >= dx + dw - handleSize && x <= dx + dw && y >= dy + dh - handleSize && y <= dy + dh) {
        return { id: source.id, type: 'resize' };
      }

      if (x >= dx && x <= dx + dw && y >= dy && y <= dy + dh) {
        return { id: source.id, type: 'drag' };
      }
    }
    return null;
  }

  private handleStart = (e: MouseEvent | TouchEvent) => {
    const pt = this.getEventPoint(e);
    const interaction = this.getInteraction(pt.x, pt.y);
    
    if (interaction) {
      const { id: sourceId, type } = interaction;
      if (this.onSelectSource) this.onSelectSource(sourceId);
      
      this.draggedSourceId = sourceId;
      this.lastMouse = pt;

      if (type === 'resize') {
        this.isResizing = true;
        this.isDragging = false;
      } else {
        this.isDragging = true;
        this.isResizing = false;
        
        if (this.isZKeyHeld) {
          // Bring to front on click if Z is held
          let maxZ = 0;
          this.sources.forEach(s => { if (s.zIndex > maxZ) maxZ = s.zIndex; });
          const source = this.sources.get(sourceId);
          if (source && source.zIndex <= maxZ) {
            source.zIndex = maxZ + 1;
            this.needsSort = true;
            if (this.onUpdateSource) this.onUpdateSource(sourceId, { zIndex: source.zIndex });
          }
        }
      }
      
      if (e.cancelable) e.preventDefault();
    }
  };

  private handleWheel = (e: WheelEvent) => {
    const pt = this.getEventPoint(e);
    const interaction = this.getInteraction(pt.x, pt.y);
    const sourceId = interaction?.id;
    
    if (sourceId) {
      e.preventDefault();
      const source = this.sources.get(sourceId);
      if (!source) return;

      if (this.isZKeyHeld) {
         // Modify Z-Index
         const step = e.deltaY > 0 ? -1 : 1;
         source.zIndex += step;
         this.needsSort = true;
         if (this.onUpdateSource) this.onUpdateSource(sourceId, { zIndex: source.zIndex });
      } else {
         // Modify Scale
         const zoomSpeed = 0.05;
         const scaleChange = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
         source.scale = Math.max(0.01, Math.min(10, source.scale + scaleChange));
         if (this.onUpdateSource) this.onUpdateSource(sourceId, { scale: source.scale });
      }
    }
  };

  private handleMove = (e: MouseEvent | TouchEvent) => {
    if ((!this.isDragging && !this.isResizing) || !this.draggedSourceId || !this.canvas) return;
    if (e.cancelable) e.preventDefault();
    
    const pt = this.getEventPoint(e);
    const deltaX = pt.x - this.lastMouse.x;
    const deltaY = pt.y - this.lastMouse.y;
    
    const source = this.sources.get(this.draggedSourceId);
    if (source) {
      if (this.isResizing) {
        // Scaling via movement
        const scaleChange = deltaX / (this.canvas.width / 2);
        source.scale = Math.max(0.01, Math.min(10, source.scale + scaleChange));
        if (this.onUpdateSource) this.onUpdateSource(this.draggedSourceId, { scale: source.scale });
      } else {
        if (this.isZKeyHeld) {
          // Z-Index via vertical drag when Z held
          if (Math.abs(deltaY) > 5) {
            const zChange = deltaY > 0 ? -1 : 1;
            source.zIndex += zChange;
            this.needsSort = true;
            if (this.onUpdateSource) this.onUpdateSource(this.draggedSourceId, { zIndex: source.zIndex });
            this.lastMouse.y = pt.y; // Limit speed
          }
        } else {
          // Normal drag
          source.position.x += deltaX / (this.canvas.width / 2);
          source.position.y += deltaY / (this.canvas.height / 2);
        }
      }
    }
    this.lastMouse = pt;
  };

  private handleEnd = () => {
    if ((this.isDragging || this.isResizing) && this.draggedSourceId && this.onUpdateSource) {
      const source = this.sources.get(this.draggedSourceId);
      if (source) {
         this.onUpdateSource(this.draggedSourceId, { 
           position: { ...source.position },
           scale: source.scale,
           zIndex: source.zIndex
         });
      }
    }
    this.isDragging = false;
    this.isResizing = false;
    this.draggedSourceId = null;
  };

  public addSource(stream: MediaStream, name: string): VideoSource {
    const id = `v-${Date.now()}`;
    const video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.srcObject = stream;
    video.muted = true;
    video.play().catch(e => console.warn("Video failed to play:", e));

    let maxZ = 0;
    this.sources.forEach(s => { if (s.zIndex > maxZ) maxZ = s.zIndex; });

    const source: VideoSource = {
      id,
      name,
      stream,
      videoElement: video,
      opacity: 1,
      blendMode: 'source-over',
      active: true,
      position: { x: 0, y: 0 },
      scale: 1,
      zIndex: maxZ + 1,
      pulseRouting: [],
      pulseOpacity: 0
    };

    this.sources.set(id, source);
    this.needsSort = true;
    return source;
  }

  public removeSource(id: string) {
    const source = this.sources.get(id);
    if (source) {
      source.stream.getTracks().forEach(t => t.stop());
      source.videoElement.pause();
      this.sources.delete(id);
      this.needsSort = true;
    }
  }

  public updateSource(id: string, update: Partial<VideoSource>) {
    const source = this.sources.get(id);
    if (source) {
      Object.assign(source, update);
      if ('zIndex' in update) {
        this.needsSort = true;
      }
    }
  }

  public getSources(): VideoSource[] {
    return Array.from(this.sources.values());
  }

  private startRender() {
    const render = () => {
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.needsSort) {
        this.sortedSourcesCache = Array.from(this.sources.values()).sort((a, b) => a.zIndex - b.zIndex);
        this.needsSort = false;
      }

      this.sortedSourcesCache.forEach(source => {
        if (!source.active || !this.ctx) return;

        // Apply pulse modulation if latched
        let finalOpacity = source.opacity;
        if (source.pulseRouting && source.pulseRouting.length > 0) {
          // Multiply base opacity by pulse envelope (floor at 0 for hard strobe)
          finalOpacity = source.opacity * (source.pulseOpacity || 0);
        }
        
        this.ctx.globalAlpha = finalOpacity;
        
        const mode = source.blendMode;
        if (mode === 'additive') this.ctx.globalCompositeOperation = 'lighter';
        else if (mode === 'subtractive') this.ctx.globalCompositeOperation = 'difference';
        else this.ctx.globalCompositeOperation = mode as GlobalCompositeOperation;
        
        const vw = source.videoElement.videoWidth;
        const vh = source.videoElement.videoHeight;
        
        if (vw > 0 && vh > 0) {
            const aspect = vw / vh;
            let dw = this.canvas!.width * source.scale;
            let dh = dw / aspect;
            
            const dx = (this.canvas!.width - dw) / 2 + (source.position.x * this.canvas!.width / 2);
            const dy = (this.canvas!.height - dh) / 2 + (source.position.y * this.canvas!.height / 2);
            
            let sourceImage: HTMLCanvasElement | HTMLVideoElement = source.videoElement;
            if (source.customFilterId) {
                const filter = this.customFiltersMap.get(source.customFilterId);
                if (filter) {
                    sourceImage = this.filterEngine.processFrame(
                        source.videoElement, 
                        filter.shaderCode, 
                        (Date.now() - this.engineStartTime) / 1000.0
                    );
                }
            }

            this.ctx.drawImage(sourceImage, dx, dy, dw, dh);

            // Visual FX Sweeps / Echos
            if (source.pulseOpacity > 0.5) {
               this.ctx.save();
               this.ctx.globalAlpha = (source.pulseOpacity - 0.5) * 2 * 0.3;
               this.ctx.filter = 'blur(10px) brightness(2)';
               this.ctx.drawImage(sourceImage, dx - 10, dy - 10, dw + 20, dh + 20);
               this.ctx.restore();
            }

            // Draw selection outline and handle
            this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(dx, dy, dw, dh);
            
            // Subtle corner accents
            const cs = 10;
            this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
            this.ctx.beginPath();
            // TL
            this.ctx.moveTo(dx, dy + cs); this.ctx.lineTo(dx, dy); this.ctx.lineTo(dx + cs, dy);
            // TR
            this.ctx.moveTo(dx + dw - cs, dy); this.ctx.lineTo(dx + dw, dy); this.ctx.lineTo(dx + dw, dy + cs);
            // BR
            this.ctx.moveTo(dx + dw, dy + dh - cs); this.ctx.lineTo(dx + dw, dy + dh); this.ctx.lineTo(dx + dw - cs, dy + dh);
            // BL
            this.ctx.moveTo(dx + cs, dy + dh); this.ctx.lineTo(dx, dy + dh); this.ctx.lineTo(dx, dy + dh - cs);
            this.ctx.stroke();

            // Resize handle indicator (bottom right)
            this.ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
            this.ctx.beginPath();
            this.ctx.moveTo(dx + dw, dy + dh);
            this.ctx.lineTo(dx + dw - 12, dy + dh);
            this.ctx.lineTo(dx + dw, dy + dh - 12);
            this.ctx.fill();
        }
      });

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  public stopRender() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleStart);
      this.canvas.removeEventListener('wheel', this.handleWheel);
      window.removeEventListener('mousemove', this.handleMove);
      window.removeEventListener('mouseup', this.handleEnd);
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      this.canvas.removeEventListener('touchstart', this.handleStart);
      window.removeEventListener('touchmove', this.handleMove);
      window.removeEventListener('touchend', this.handleEnd);
    }
  }
}

export const videoEngine = new VideoEngine();
