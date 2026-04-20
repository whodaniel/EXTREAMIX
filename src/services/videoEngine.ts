import { VideoSource } from '../types';

class VideoEngine {
  private sources: Map<string, VideoSource> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  private isDragging = false;
  private draggedSourceId: string | null = null;
  private lastMouse: { x: number, y: number } = { x: 0, y: 0 };
  public onUpdateSource?: (id: string, update: Partial<VideoSource>) => void;

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.startRender();
    this.attachEvents();
  }

  private attachEvents() {
    if (!this.canvas) return;
    this.canvas.addEventListener('mousedown', this.handleStart);
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);
    
    this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
    window.addEventListener('touchmove', this.handleMove, { passive: false });
    window.addEventListener('touchend', this.handleEnd);
  }

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

  private getSourceAtPoint(x: number, y: number): string | null {
    if (!this.canvas) return null;
    const sourcesArr = Array.from(this.sources.values()).reverse();
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
      
      if (x >= dx && x <= dx + dw && y >= dy && y <= dy + dh) {
        return source.id;
      }
    }
    return null;
  }

  private handleStart = (e: MouseEvent | TouchEvent) => {
    const pt = this.getEventPoint(e);
    const sourceId = this.getSourceAtPoint(pt.x, pt.y);
    if (sourceId) {
      this.isDragging = true;
      this.draggedSourceId = sourceId;
      this.lastMouse = pt;
      if (e.cancelable) e.preventDefault();
    }
  };

  private handleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isDragging || !this.draggedSourceId || !this.canvas) return;
    if (e.cancelable) e.preventDefault();
    
    const pt = this.getEventPoint(e);
    const deltaX = pt.x - this.lastMouse.x;
    const deltaY = pt.y - this.lastMouse.y;
    
    const source = this.sources.get(this.draggedSourceId);
    if (source) {
      source.position.x += deltaX / (this.canvas.width / 2);
      source.position.y += deltaY / (this.canvas.height / 2);
    }
    this.lastMouse = pt;
  };

  private handleEnd = () => {
    if (this.isDragging && this.draggedSourceId && this.onUpdateSource) {
      const source = this.sources.get(this.draggedSourceId);
      if (source) {
         this.onUpdateSource(this.draggedSourceId, { position: { ...source.position } });
      }
    }
    this.isDragging = false;
    this.draggedSourceId = null;
  };

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
      scale: 1,
      pulseRouting: [],
      pulseOpacity: 0
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
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.sources.forEach(source => {
        if (!source.active || !this.ctx) return;

        // Apply pulse modulation if latched
        let finalOpacity = source.opacity;
        if (source.pulseRouting && source.pulseRouting.length > 0) {
          // Multiply base opacity by pulse envelope (floor to avoid zero glitches)
          finalOpacity = source.opacity * (0.1 + (source.pulseOpacity || 0) * 0.9);
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
            
            this.ctx.drawImage(source.videoElement, dx, dy, dw, dh);
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
      window.removeEventListener('mousemove', this.handleMove);
      window.removeEventListener('mouseup', this.handleEnd);
      this.canvas.removeEventListener('touchstart', this.handleStart);
      window.removeEventListener('touchmove', this.handleMove);
      window.removeEventListener('touchend', this.handleEnd);
    }
  }
}

export const videoEngine = new VideoEngine();
