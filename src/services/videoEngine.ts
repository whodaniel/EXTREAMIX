import { VideoSource } from '../types';

class VideoEngine {
  private sources: Map<string, VideoSource> = new Map();
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private uniforms: any = {};


  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.startRender();
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

        this.ctx.globalAlpha = source.opacity;
        
        // Handle advanced blending
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
            
            // Apply repositioning (normalized coordinates -1 to 1)
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
  }

  public updateUniforms(uniforms: any) {
    this.uniforms = { ...this.uniforms, ...uniforms };
    // In a real implementation this would pass to the webgl shaders
    console.log('Updated video engine uniforms:', this.uniforms);
  }
}

export const videoEngine = new VideoEngine();
