import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wand2, Code, Play, RefreshCcw, Lock, Video, Save, Trash2 } from 'lucide-react';
import { VideoSource, CustomVideoFilter } from '../types';

// Some basic default shaders for demo
const DEFAULT_SHADERS = {
  passthrough: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  gl_FragColor = texture2D(u_image, v_texCoord);
}
  `.trim(),
  grayscale: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(vec3(gray), color.a);
}
  `.trim(),
  invert: `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  gl_FragColor = vec4(1.0 - color.rgb, color.a);
}
  `.trim(),
  crt: `
precision mediump float;
uniform sampler2D u_image;
uniform float u_time;
varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  // Distort uv
  uv.y += sin(uv.x * 10.0 + u_time * 5.0) * 0.01;
  uv.x += cos(uv.y * 10.0 + u_time * 5.0) * 0.01;
  vec4 color = texture2D(u_image, uv);
  
  // Add scanlines
  float scanline = sin(uv.y * 800.0) * 0.04;
  color.rgb -= scanline;
  
  // Chromatic aberration
  float shift = 0.005;
  float r = texture2D(u_image, uv + vec2(shift, 0.0)).r;
  float b = texture2D(u_image, uv - vec2(shift, 0.0)).b;
  gl_FragColor = vec4(r, color.g, b, color.a);
}
  `.trim()
};

export const WebGLPreview = ({ stream, fragmentShader }: { stream: MediaStream | null, fragmentShader: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(console.error);
  }, [stream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    
    // Quick initialize basic WebGL to run fragment shader
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vertexShaderSrc = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // flip y for standard video coordinate
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: ", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShader);
    
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,   1.0, -1.0,   -1.0,  1.0,
      -1.0,  1.0,   1.0, -1.0,    1.0,  1.0
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,   1.0, 0.0,   0.0, 1.0,
      0.0, 1.0,   1.0, 0.0,   1.0, 1.0
    ]), gl.STATIC_DRAW);

    const posLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    const texLocation = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const timeLocation = gl.getUniformLocation(program, "u_time");

    const render = () => {
      // Must set canvas size to match layout
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      if (video.readyState >= 2) {
        // Upload video frame to texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }
      
      if (timeLocation !== null) {
          gl.uniform1f(timeLocation, (Date.now() - startTime.current) / 1000.0);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, [fragmentShader, stream]); // re-run if shader or stream changes

  return (
    <div className="w-full h-full relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-contain" />
    </div>
  );
};

export const FilterDesignerView = ({ 
  activeEntitlements,
  videoSources,
  customFilters,
  setCustomFilters
}: { 
  activeEntitlements: string[];
  videoSources: VideoSource[];
  customFilters: CustomVideoFilter[];
  setCustomFilters: React.Dispatch<React.SetStateAction<CustomVideoFilter[]>>;
}) => {
  const isUnlocked = activeEntitlements.includes('ai_filter_forge') || activeEntitlements.includes('Extreamix Pro');
  
  // Fake state for credits
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('extreamix_ai_credits');
    return saved ? parseInt(saved) : 50; // default initial credits on first use
  });

  const [activeSourceId, setActiveSourceId] = useState<string>(videoSources[0]?.id || '');
  const [shaderCode, setShaderCode] = useState(DEFAULT_SHADERS.passthrough);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterName, setFilterName] = useState("");

  const activeStream = videoSources.find(s => s.id === activeSourceId)?.stream || null;

  useEffect(() => {
    if (!activeSourceId && videoSources.length > 0) {
      setActiveSourceId(videoSources[0].id);
    }
  }, [videoSources, activeSourceId]);

  const handleGenerate = async () => {
    if (credits <= 0) {
      alert("No credits remaining! Visit the Add-ons page to refill.");
      return;
    }
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 2000));
    
    // Because we don't have a real AI hookup in the frontend yet without exposing keys,
    // we will cycle a fake response based on keywords for demonstration.
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('crt') || lowerPrompt.includes('glitch') || lowerPrompt.includes('retro')) {
        setShaderCode(DEFAULT_SHADERS.crt);
        setFilterName("AI Retro CRT");
    } else if (lowerPrompt.includes('invert') || lowerPrompt.includes('negative')) {
        setShaderCode(DEFAULT_SHADERS.invert);
        setFilterName("AI Invert");
    } else if (lowerPrompt.includes('gray') || lowerPrompt.includes('black and white')) {
        setShaderCode(DEFAULT_SHADERS.grayscale);
        setFilterName("AI Grayscale");
    } else {
        // Just return crt randomly if it didn't match
        setShaderCode(DEFAULT_SHADERS.crt);
        setFilterName("AI Generated Filter");
    }

    setCredits(prev => {
        const next = Math.max(0, prev - 1);
        localStorage.setItem('extreamix_ai_credits', next.toString());
        return next;
    });

    setIsGenerating(false);
  };

  const handleSaveFilter = () => {
      const newFilter: CustomVideoFilter = {
          id: 'filter-' + Date.now(),
          name: filterName || 'Untitled Filter',
          shaderCode
      };
      setCustomFilters(prev => [...prev, newFilter]);
      setFilterName(""); // reset name input
  };
  
  const handleDeleteFilter = (id: string) => {
      setCustomFilters(prev => prev.filter(f => f.id !== id));
  }

  if (!isUnlocked) {
    return (
      <div className="flex-1 w-full bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8 text-center">
        <Lock className="w-16 h-16 text-outline opacity-20 mb-6" />
        <h2 className="font-headline text-2xl text-white uppercase tracking-widest font-black mb-4">Module Locked</h2>
        <p className="text-outline text-sm max-w-md font-mono mb-8">
          The AI Filter Forge module is not activated on this workspace. Unlock it in the Add-ons panel to start generating live video filters with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row p-4 gap-6">
      {/* Left panel: Prompt & Control */}
      <div className="w-full md:w-[350px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-20 md:pb-0">
        <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-lg text-white uppercase tracking-widest font-black flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" /> Filter Forge
            </h2>
            <div className="text-[10px] font-mono text-outline bg-surface-container rounded-full px-3 py-1 flex items-center gap-1 border border-white/10">
                <span className="text-primary font-bold">{credits}</span> CREDITS
            </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4 border border-white/5">
            <label className="text-[10px] uppercase font-headline tracking-widest text-outline block mb-2">Input Source</label>
            {videoSources.length === 0 ? (
                <div className="text-[10px] text-error font-mono flex items-center gap-2">
                    <Video className="w-3 h-3" /> No visual inputs detected.
                </div>
            ) : (
                <select 
                    value={activeSourceId} 
                    onChange={e => setActiveSourceId(e.target.value)}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer hover:border-primary/30 transition-all font-mono"
                 >
                    {videoSources.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                 </select>
            )}
        </div>

        <div className="bg-surface-container-low rounded-2xl p-4 border border-white/5 flex flex-col">
            <label className="text-[10px] uppercase font-headline tracking-widest text-outline block mb-2">AI Generation Prompt</label>
            <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your filter. E.g. 'A retro CRT monitor with extreme chromatic aberration and scanlines' or 'Invert the colors and add a red tint'."
                className="w-full h-[100px] bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono resize-none mb-4 custom-scrollbar"
            />
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || credits <= 0}
                className="w-full py-3 rounded-xl bg-primary text-on-primary-container disabled:opacity-50 disabled:bg-surface-container disabled:text-outline font-headline font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
                {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? 'Synthesizing...' : 'Generate (1 Credit)'}
            </button>
        </div>
        
        <div className="bg-surface-container-low rounded-2xl p-4 border border-white/5 flex flex-col">
           <label className="text-[10px] uppercase font-headline tracking-widest text-outline block mb-2">Save as Preset</label>
           <div className="flex items-center gap-2 mb-4">
             <input 
                type="text" 
                placeholder="Filter Name..."
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                className="flex-1 bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
             />
             <button 
                onClick={handleSaveFilter}
                disabled={!filterName.trim() || !shaderCode.trim()}
                className="w-10 h-10 rounded-xl bg-surface-container-highest border border-white/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all disabled:opacity-50"
             >
                <Save className="w-4 h-4" />
             </button>
           </div>
           
           <label className="text-[10px] uppercase font-headline tracking-widest text-outline block mb-2">Saved Filters</label>
           <div className="space-y-2">
             {customFilters.length === 0 ? (
                 <div className="text-[10px] text-outline font-mono text-center py-4 bg-black/20 rounded-xl">No saved filters yet</div>
             ) : (
                 customFilters.map(filter => (
                     <div key={filter.id} className="flex items-center justify-between bg-surface-container border border-white/5 rounded-xl p-2 group hover:border-primary/30 transition-all">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                              setShaderCode(filter.shaderCode);
                              setFilterName(filter.name);
                          }}
                        >
                          <div className="text-xs text-white font-headline font-bold truncate">{filter.name}</div>
                          <div className="text-[9px] text-outline font-mono truncate">{filter.id}</div>
                        </div>
                        <button 
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="w-8 h-8 flex items-center justify-center text-error opacity-50 hover:opacity-100 hover:bg-error/20 rounded-lg transition-all"
                        >
                           <Trash2 className="w-3 h-3" />
                        </button>
                     </div>
                 ))
             )}
           </div>
        </div>
      </div>

      {/* Right panel: Preview & Code */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 pb-16 md:pb-0">
        <div className="flex-1 rounded-2xl bg-black border border-white/5 overflow-hidden flex items-center justify-center">
             {activeStream ? (
                 <WebGLPreview stream={activeStream} fragmentShader={shaderCode} />
             ) : (
                 <div className="text-outline/30 flex flex-col items-center gap-4">
                     <Video className="w-12 h-12" />
                     <div className="font-mono text-xs uppercase">Awaiting Video Target</div>
                 </div>
             )}
        </div>
        
        <div className="h-[200px] bg-surface-container-low rounded-2xl border border-white/5 p-4 flex flex-col min-h-0 shrink-0">
             <div className="flex justify-between items-center mb-2">
                 <label className="text-[10px] uppercase font-headline tracking-widest text-outline flex items-center gap-2">
                     <Code className="w-3 h-3" /> Filter Fragment Shader (GLSL)
                 </label>
                 <button onClick={() => setShaderCode(DEFAULT_SHADERS.passthrough)} className="text-[9px] uppercase font-mono tracking-widest text-primary hover:underline">Reset</button>
             </div>
             <textarea 
                value={shaderCode}
                onChange={e => setShaderCode(e.target.value)}
                className="w-full flex-1 bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-[10px] text-[#A6E22E] outline-none focus:border-primary/50 transition-all font-mono resize-none custom-scrollbar"
                spellCheck="false"
             />
        </div>
      </div>
    </div>
  )
}

