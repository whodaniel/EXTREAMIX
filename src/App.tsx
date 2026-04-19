/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Bell, 
  User, 
  SlidersHorizontal, 
  LayoutGrid, 
  Route as RouteIcon, 
  Library as LibraryIcon,
  Mic,
  Monitor,
  Music,
  Plus,
  Trash2,
  Volume2,
  Repeat,
  History,
  Timer,
  Mic2,
  ChevronDown,
  Video,
  Layers,
  Zap,
  ExternalLink,
  Maximize2,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, ChannelState, SequencerState, RoutingSource, VideoSource } from './types';
import { extreamixEngine } from './services/ExtreamixEngine';
import { videoEngine } from './services/videoEngine';

// --- Shared Components ---

const IconButton = ({ 
  icon: Icon, 
  active = false, 
  onClick, 
  className = "",
  label
}: { 
  icon: any, 
  active?: boolean, 
  onClick?: () => void, 
  className?: string,
  label: string
}) => (
  <button 
    onClick={onClick}
    aria-label={label}
    className={`p-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
      active 
        ? "text-primary bg-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]" 
        : "text-outline hover:text-primary hover:bg-surface-container"
    } ${className}`}
  >
    <Icon className="w-5 h-5" aria-hidden="true" />
  </button>
);

const NavItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`flex-1 md:w-full flex flex-col items-center justify-center py-2 md:py-4 transition-all duration-300 relative group focus:outline-none focus:bg-primary/10 ${
      active ? "bg-primary/10 md:bg-primary/20 text-primary" : "text-outline hover:bg-surface-container hover:text-white"
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="absolute top-0 left-0 right-0 md:top-0 md:bottom-0 md:left-auto md:right-0 h-0.5 md:h-auto md:w-1 bg-primary shadow-[0_0_10px_#38bdf8]" 
      />
    )}
    <Icon className={`w-5 h-5 md:w-6 md:h-6 mb-0.5 md:mb-1 group-hover:scale-110 transition-transform duration-200`} aria-hidden="true" />
    <span className="font-headline text-[7px] md:text-[10px] font-bold tracking-widest uppercase">{label}</span>
  </button>
);

// --- Sub-Views ---

const VisionView = ({ sources, onUpdate, onAdd, channels }: { sources: VideoSource[], onUpdate: (id: string, update: Partial<VideoSource>) => void, onAdd: () => void, channels: ChannelState[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screens, setScreens] = useState<any[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      videoEngine.init(canvasRef.current);
    }

    const checkScreens = async () => {
      if ('getScreenDetails' in window) {
        try {
          // @ts-ignore
          const details = await window.getScreenDetails();
          setScreens(details.screens);
        } catch (e) {
          console.warn('Screen details permission denied or not supported');
        }
      }
    };
    checkScreens();

    return () => videoEngine.stopRender();
  }, []);

  const handleLaunchProjector = (screen?: any) => {
    const width = 1280;
    const height = 720;
    const left = screen ? screen.availLeft + (screen.availWidth - width) / 2 : (window.screen.width - width) / 2;
    const top = screen ? screen.availTop + (screen.availHeight - height) / 2 : (window.screen.height - height) / 2;
    
    window.open(
      `${window.location.origin}/?projector=true`, 
      'VisionProjector', 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,location=no`
    );
  };

  const handleFullscreen = () => {
    if (canvasRef.current) {
      canvasRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 overflow-y-auto xl:overflow-hidden min-h-0 p-2 md:p-4 custom-scrollbar lg:pb-20 xl:pb-0">
      {/* Main Canvas Monitor */}
      <div 
        className="flex-[3] min-h-[400px] xl:min-h-0 bg-black rounded-3xl border border-white/10 overflow-hidden relative group shadow-2xl"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain" 
          width={1920} height={1080} 
          role="img" 
          aria-label="Vision Mixer Master Output Monitor"
        />
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-1 pointer-events-none">
          <div className="font-headline text-[9px] md:text-[10px] text-primary bg-black/60 px-3 py-1 rounded-full border border-primary/20 tracking-widest uppercase backdrop-blur-md">
            MASTER_VISION_OUT
          </div>
          <div className="font-headline text-[8px] text-outline px-3 tracking-widest uppercase hidden sm:block">
            30FPS | PRORES_RAW_SIM
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2 md:gap-3">
           <button onClick={handleFullscreen} className="bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md transition-all active:scale-95">
             <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
           </button>
           <button onClick={onAdd} className="bg-primary hover:bg-white text-on-primary-container px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-headline font-black text-[10px] md:text-xs flex items-center gap-2 shadow-[0_20px_50px_rgba(142,213,255,0.3)] active:scale-95 transition-all uppercase tracking-widest">
             <Plus className="w-4 h-4" />
             <span className="hidden sm:inline">NEW_FEED</span>
             <span className="sm:hidden">ADD</span>
           </button>
        </div>
      </div>

      {/* Control Panel */}
      <aside 
        className="flex-1 bg-surface-container-high/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 md:p-6 flex flex-col gap-6 overflow-y-auto xl:overflow-hidden min-h-0 custom-scrollbar shadow-2xl mt-4 xl:mt-0"
      >
        <div className="flex items-center justify-between sticky top-0 bg-surface-container-high/80 backdrop-blur-xl -mx-4 -mt-4 md:-mx-6 md:-mt-6 p-4 md:p-6 border-b border-white/5 z-20">
           <div>
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none">Vision_Hub</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Multi-Spectral Blending</span>
           </div>
           <Zap className="w-4 h-4 md:w-5 md:h-5 text-tertiary animate-pulse" />
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
           {/* Output Monitor Selection */}
           <div className="bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-primary/20 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Tv className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <h4 className="font-headline text-[9px] md:text-[10px] text-white tracking-[0.2em] font-black uppercase font-bold">Projector_Hub</h4>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleLaunchProjector()}
                  className="flex items-center justify-between w-full bg-surface-container-highest/50 hover:bg-surface-container-highest p-3 md:p-4 rounded-xl border border-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 text-outline" />
                    <span className="font-headline text-[9px] md:text-[10px] text-white uppercase">Pop-out Monitor</span>
                  </div>
                  <div className="text-[7px] md:text-[8px] text-outline p-1 bg-black/30 rounded">WNDW</div>
                </button>

                {screens.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-headline text-[8px] text-outline uppercase px-1 mt-2">Available Screens</p>
                    {screens.map((screen, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleLaunchProjector(screen)}
                        className="flex items-center justify-between w-full bg-primary/5 hover:bg-primary/10 p-3 md:p-4 rounded-xl border border-primary/10 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Monitor className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                          <div>
                            <span className="font-headline text-[9px] text-white uppercase block">Screen {idx + 1}</span>
                            <span className="text-[7px] md:text-[8px] text-outline">{screen.width}x{screen.height}</span>
                          </div>
                        </div>
                        {screen.isPrimary && <div className="text-[6px] md:text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Main</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
           </div>

           {sources.map(source => (
             <div key={source.id} className="bg-surface-container-low/50 rounded-2xl p-5 border border-white/5 space-y-6 hover:bg-surface-container-low transition-colors group">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Monitor className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <span className="font-headline text-xs font-bold block truncate max-w-[120px] uppercase text-white">{source.name}</span>
                     <span className="text-[8px] text-outline font-mono uppercase tracking-tighter">{source.id}</span>
                   </div>
                 </div>
                 <button 
                  onClick={() => onUpdate(source.id, { active: !source.active })}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${source.active ? 'bg-primary text-on-primary-container shadow-[0_0_20px_rgba(142,213,255,0.4)]' : 'bg-surface-container-highest text-outline border border-white/10'}`}
                 >
                   <Layers className="w-4 h-4" />
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <div className="flex justify-between font-headline text-[9px] text-outline uppercase tracking-wider">
                     <span>Opacity</span>
                     <span className="text-primary">{Math.round(source.opacity * 100)}%</span>
                   </div>
                   <input 
                     type="range" min="0" max="1" step="0.01" value={source.opacity}
                     onChange={e => onUpdate(source.id, { opacity: parseFloat(e.target.value) })}
                     className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary"
                   />
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between font-headline text-[9px] text-outline uppercase tracking-wider">
                     <span>Scale</span>
                     <span className="text-primary">{Math.round(source.scale * 100)}%</span>
                   </div>
                   <input 
                     type="range" min="0.1" max="3" step="0.01" value={source.scale}
                     onChange={e => onUpdate(source.id, { scale: parseFloat(e.target.value) })}
                     className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-headline text-[9px] text-outline uppercase tracking-wider">X Position</div>
                    <input 
                      type="range" min="-1" max="1" step="0.01" value={source.position.x}
                      onChange={e => onUpdate(source.id, { position: { ...source.position, x: parseFloat(e.target.value) } })}
                      className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-tertiary"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="font-headline text-[9px] text-outline uppercase tracking-wider">Y Position</div>
                    <input 
                      type="range" min="-1" max="1" step="0.01" value={source.position.y}
                      onChange={e => onUpdate(source.id, { position: { ...source.position, y: parseFloat(e.target.value) } })}
                      className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-tertiary"
                    />
                  </div>
               </div>

               <div className="space-y-2">
                 <div className="font-headline text-[9px] text-outline uppercase tracking-wider">Spectral Blend Mode</div>
                 <select 
                   value={source.blendMode}
                   onChange={e => onUpdate(source.id, { blendMode: e.target.value })}
                   className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer hover:border-primary/30 transition-all font-headline font-bold uppercase tracking-wider"
                 >
                   <optgroup label="Standard" className="bg-surface-container">
                    <option value="source-over">Normal</option>
                    <option value="screen">Screen</option>
                    <option value="multiply">Multiply</option>
                    <option value="overlay">Overlay</option>
                   </optgroup>
                   <optgroup label="Spectral / Color" className="bg-surface-container">
                    <option value="additive">Additive (Glow)</option>
                    <option value="subtractive">Subtractive (Difference)</option>
                    <option value="exclusion">Exclusion</option>
                    <option value="hue">Hue Spectral</option>
                    <option value="color">Full Color</option>
                    <option value="luminosity">Luminance Isolation</option>
                    <option value="color-dodge">Color Dodge</option>
                   </optgroup>
                 </select>
               </div>

               <div className="space-y-2">
                 <div className="flex items-center gap-2 font-headline text-[9px] text-outline uppercase tracking-wider">
                   <Volume2 className="w-3 h-3 text-primary" />
                   <span>Audio Routing Bus</span>
                 </div>
                 <select 
                   value={source.audioChannelId || ''}
                   onChange={e => onUpdate(source.id, { audioChannelId: e.target.value })}
                   className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer hover:border-primary/30 transition-all font-headline font-bold uppercase tracking-wider"
                 >
                   <option value="">NO_ROUTING</option>
                   {channels.map(ch => (
                     <option key={ch.id} value={ch.id}>OUTPUT: {ch.name}</option>
                   ))}
                 </select>
               </div>
             </div>
           ))}

           {sources.length === 0 && (
             <div className="py-20 text-center text-outline">
               <Video className="w-16 h-16 mx-auto mb-6 opacity-10" />
               <p className="font-headline text-xs uppercase tracking-[0.3em] font-black opacity-30">NO_VISUAL_INPUT</p>
             </div>
           )}
        </div>
      </aside>
    </div>
  );
};

const VUMeter = ({ analyser, orientation = 'vertical', className = "" }: { analyser?: AnalyserNode | null, orientation?: 'vertical' | 'horizontal', className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS or Peak level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const level = Math.min(1, average / 128); // Normalized level

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const segments = 12;
      const gap = 2;
      
      if (orientation === 'vertical') {
        const segHeight = (canvas.height - (segments - 1) * gap) / segments;
        for (let i = 0; i < segments; i++) {
          const threshold = (i + 1) / segments;
          const isActive = level >= threshold;
          
          let color = '#38bdf8'; // Blue
          if (i > segments * 0.8) color = '#f87171'; // Red (peak)
          else if (i > segments * 0.6) color = '#fbbf24'; // Yellow (warning)

          ctx.fillStyle = isActive ? color : 'rgba(255, 255, 255, 0.05)';
          if (isActive) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
          } else {
            ctx.shadowBlur = 0;
          }
          
          ctx.fillRect(0, canvas.height - (i + 1) * (segHeight + gap), canvas.width, segHeight);
        }
      } else {
        const segWidth = (canvas.width - (segments - 1) * gap) / segments;
        for (let i = 0; i < segments; i++) {
          const threshold = (i + 1) / segments;
          const isActive = level >= threshold;
          
          let color = '#38bdf8';
          if (i > segments * 0.8) color = '#f87171';
          else if (i > segments * 0.6) color = '#fbbf24';

          ctx.fillStyle = isActive ? color : 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(i * (segWidth + gap), 0, segWidth, canvas.height);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, orientation]);

  return <canvas ref={canvasRef} width={orientation === 'vertical' ? 12 : 120} height={orientation === 'vertical' ? 120 : 12} className={className} />;
};

const MixerView = ({ channels, updateChannel, transcripts }: { channels: ChannelState[], updateChannel: (id: string, state: Partial<ChannelState>) => void, transcripts: string[] }) => {
  const mixerCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mixerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const draw = () => {
      const analyser = extreamixEngine.getMasterAnalyser();
      if (!analyser) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#070d1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = i % 10 === 0 ? '#56e5a9' : '#38bdf8';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-y-auto xl:overflow-hidden min-h-0 p-2 md:p-4 custom-scrollbar">
      {/* Mixer Console Area */}
      <div 
        className="flex-[2.5] bg-surface-container-high/20 backdrop-blur-3xl rounded-3xl border border-white/10 p-4 md:p-6 flex flex-col gap-6 overflow-hidden min-h-[500px] xl:min-h-0 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
           <div>
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none">SIGNAL_CONSOLE_v4</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Core Audio Mixing Engine</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[9px] text-primary font-black uppercase">LIVE_MIX</span>
           </div>
        </div>
        <div className="flex-1 flex gap-4 md:gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
          {channels.map(channel => (
            <div key={channel.id} className="w-56 md:w-64 flex-shrink-0 bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-4 md:p-5 flex flex-col gap-6 border border-white/5 hover:border-primary/20 transition-all group relative focus-within:ring-2 focus-within:ring-primary/30 outline-none">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
              
              {/* Channel Header */}
              <div className="flex flex-col items-center z-10">
                <div className="font-headline text-[9px] text-outline tracking-[0.3em] mb-1 uppercase" aria-hidden="true">CH_{channel.id.split('-')[1] || '0'}</div>
                <h4 className="font-headline text-sm text-white font-black uppercase truncate w-full text-center glow-text">{channel.name}</h4>
              </div>
              
              {/* Main Controls Split */}
              <div className="flex gap-4 z-10 h-64">
                {/* VU Meter & Volume Fader Block */}
                <div className="flex bg-surface-container-lowest/50 rounded-xl p-2 items-stretch gap-2">
                   {/* Channel VU Meter */}
                   <VUMeter 
                    analyser={extreamixEngine.getChannelAnalyser(channel.id)}
                    orientation="vertical" 
                    className="w-1.5 h-full opacity-80" 
                   />
                   
                   {/* Volume Fader */}
                   <div className="w-8 flex flex-col items-center">
                      <input 
                       type="range" min="0" max="1" step="0.01" value={channel.volume}
                       aria-label={`Volume for ${channel.name}`}
                       onChange={e => updateChannel(channel.id, { volume: parseFloat(e.target.value) })}
                       className="h-full w-1 appearance-none bg-surface-container-highest rounded-full accent-primary [writing-mode:bt-lr] -webkit-appearance-slider-vertical focus:ring-2 focus:ring-primary/50 cursor-pointer"
                       style={{ WebkitAppearance: 'slider-vertical', touchAction: 'none' } as any}
                     />
                     <div className="mt-2 font-mono text-[8px] text-outline uppercase" aria-hidden="true">VOL</div>
                   </div>
                </div>

                {/* 3D Panner XY Pad */}
                <div className="flex-1 bg-surface-container-lowest/50 rounded-xl p-3 flex flex-col gap-2">
                   <div className="flex justify-between font-headline text-[8px] text-outline uppercase tracking-widest leading-none">
                      <span>3D_SPATIAL</span>
                      <span className="text-primary" aria-label={`3D Position coordinate: ${channel.pan.toFixed(2)}, ${channel.depth.toFixed(2)}`}>{channel.pan.toFixed(2)}, {channel.depth.toFixed(2)}</span>
                   </div>
                   <div 
                    tabIndex={0}
                    role="slider"
                    aria-label={`3D Position for ${channel.name}. Use arrow keys to move or touch drag.`}
                    aria-valuemin={-1}
                    aria-valuemax={1}
                    aria-valuenow={channel.pan}
                    onKeyDown={(e) => {
                      const step = 0.1;
                      if (e.key === 'ArrowLeft') updateChannel(channel.id, { pan: Math.max(-1, channel.pan - step) });
                      if (e.key === 'ArrowRight') updateChannel(channel.id, { pan: Math.min(1, channel.pan + step) });
                      if (e.key === 'ArrowUp') updateChannel(channel.id, { depth: Math.max(-1, channel.depth - step) });
                      if (e.key === 'ArrowDown') updateChannel(channel.id, { depth: Math.min(1, channel.depth + step) });
                    }}
                    className="flex-1 relative bg-black/60 rounded-lg border border-white/5 overflow-hidden group/pad cursor-crosshair shadow-inner focus:ring-2 focus:ring-primary/50 touch-none"
                    onPointerDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                      const z = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                      updateChannel(channel.id, { pan: x, depth: z });
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons === 1 || e.pointerType === 'touch') {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        const z = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                        updateChannel(channel.id, { pan: Math.max(-1, Math.min(1, x)), depth: Math.max(-1, Math.min(1, z)) });
                      }
                    }}
                   >
                     {/* Background Grid */}
                     <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.03]">
                        {[...Array(16)].map((_, i) => <div key={i} className="border border-white" />)}
                     </div>

                     {/* Horizontal/Vertical center lines */}
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20" />
                     <div className="absolute left-1/2 top-0 h-full w-[1px] bg-primary/20" />
                     
                     {/* Directional Labels */}
                     <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[6px] text-outline/40 font-black tracking-widest uppercase">FRONT</div>
                     <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[6px] text-outline/40 font-black tracking-widest uppercase">BACK</div>
                     <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[6px] text-outline/40 font-black tracking-widest uppercase">LEFT</div>
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[6px] text-outline/40 font-black tracking-widest uppercase">RIGHT</div>

                     {/* Current Position Indicator */}
                     <motion.div 
                      className="absolute rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                      animate={{ 
                        left: `${(channel.pan + 1) * 50}%`, 
                        top: `${(channel.depth + 1) * 50}%`,
                        scale: 1 - (channel.depth * 0.3),
                        width: '24px',
                        height: '24px',
                        boxShadow: `0 0 ${20 - channel.depth * 10}px rgba(56, 189, 248, ${0.4 + channel.depth * -0.2})`
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                     >
                       <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                     </motion.div>
                   </div>
                </div>
              </div>

              {/* Parametric EQ Section */}
              <div className="grid grid-cols-3 gap-2 z-10">
                {[
                  { key: 'low' as const, label: 'LOW', color: 'accent-error' },
                  { key: 'mid' as const, label: 'MID', color: 'accent-tertiary' },
                  { key: 'high' as const, label: 'HIGH', color: 'accent-primary' }
                ].map(eq => (
                  <div key={eq.key} className="flex flex-col items-center gap-1">
                    <input 
                      type="range" min="-12" max="12" step="0.1" value={channel.eq[eq.key]}
                      onChange={e => updateChannel(channel.id, { eq: { ...channel.eq, [eq.key]: parseFloat(e.target.value) } })}
                      className={`w-full h-1 bg-surface-container-highest appearance-none rounded-full ${eq.color} cursor-pointer`}
                      style={{ touchAction: 'none' }}
                    />
                    <div className="font-headline text-[7px] text-outline uppercase font-black">{eq.label}</div>
                    <div className="font-mono text-[7px] text-primary">{channel.eq[eq.key] > 0 ? '+' : ''}{channel.eq[eq.key].toFixed(1)}</div>
                  </div>
                ))}
              </div>

              {/* Solo/Mute */}
              <div className="grid grid-cols-2 gap-2 z-10">
                <button 
                  onClick={() => updateChannel(channel.id, { mute: !channel.mute })}
                  aria-pressed={channel.mute}
                  className={`py-2 rounded-lg font-headline text-[10px] uppercase font-black transition-all ${channel.mute ? 'bg-error text-on-error shadow-[0_0_10px_rgba(255,180,171,0.3)]' : 'bg-surface-container-highest text-outline hover:text-white'}`}
                >
                  MUTE
                </button>
                <button 
                  onClick={() => updateChannel(channel.id, { solo: !channel.solo })}
                  aria-pressed={channel.solo}
                  className={`py-2 rounded-lg font-headline text-[10px] uppercase font-black transition-all ${channel.solo ? 'bg-tertiary text-on-tertiary shadow-[0_0_10px_rgba(86,229,169,0.3)]' : 'bg-surface-container-highest text-outline hover:text-white'}`}
                >
                  SOLO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Monitor Area */}
      <div 
        className="flex-1 flex flex-col gap-6 overflow-y-auto xl:overflow-hidden min-h-0 z-20 custom-scrollbar mt-4 xl:mt-0"
      >
        {/* FFT Monitor */}
        <div className="min-h-[240px] bg-surface-container-high/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-headline text-[10px] text-primary tracking-[0.3em] font-black uppercase">Spectral_Analyser</h4>
            <div className="flex items-center gap-4">
               {/* Master Output VU Meter */}
               <div className="flex flex-col items-end gap-1">
                 <VUMeter analyser={extreamixEngine.getMasterAnalyser()} orientation="horizontal" className="w-24 h-2 opacity-100" />
                 <span className="font-mono text-[7px] text-outline/50 uppercase">MASTER_PEAK</span>
               </div>
               <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" aria-hidden="true" />
            </div>
          </div>
          <canvas 
            ref={mixerCanvasRef} 
            className="flex-1 w-full bg-black/40 rounded-xl border border-white/5 mb-2"
            role="img"
            aria-label="Real-time spectral analyzer monitor"
          />
          <div className="flex justify-between font-mono text-[8px] text-outline/50 uppercase">
             <span>20Hz</span>
             <span>Crossover Active</span>
             <span>22kHz</span>
          </div>
        </div>

        {/* Live Logs */}
        <div className="flex-1 bg-surface-container-high/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-headline text-[10px] text-outline tracking-[0.3em] font-black uppercase">Transcription_Bus</h4>
             <History className="w-3.5 h-3.5 text-outline/40" />
          </div>
          <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-y-auto custom-scrollbar">
            {transcripts.map((t, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                className="mb-2 last:mb-0 pb-2 border-b border-white/5 last:border-0"
              >
                <span className="text-emerald-900 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                {t}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SequencerView = ({ state, toggleStep }: { state: SequencerState, toggleStep: (i: number) => void }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl bg-surface-container-high rounded-2xl p-6 md:p-8 border-t border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 font-headline text-[10px] text-outline opacity-20 select-none" aria-hidden="true">SEQ_MATRIX_v1.0</div>
        
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-headline text-lg md:text-xl text-primary font-bold tracking-tighter">PULSE_ARRAY_GATE</h2>
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-lg border border-white/5">
              <Timer className="w-4 h-4 text-outline" aria-hidden="true" />
              <span className="font-headline text-sm text-white font-bold">{state.bpm} BPM</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2 md:gap-3">
            {state.steps.map((active, i) => (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                aria-label={`Step ${i + 1}, ${active ? 'active' : 'inactive'}${state.currentStep === i ? ', currently at playhead' : ''}`}
                aria-pressed={active}
                className={`aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  active 
                    ? "bg-primary border-primary shadow-[0_0_20px_rgba(56,189,248,0.4)]" 
                    : "bg-surface-container-lowest border-white/5 hover:border-primary/40"
                } ${state.currentStep === i ? "ring-4 ring-white/50" : ""}`}
              >
                {/* Background active state glow */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                )}

                {/* Trigger Animation */}
                <AnimatePresence>
                  {state.currentStep === i && (
                    <>
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`absolute inset-0 rounded-lg ${active ? 'bg-white' : 'bg-primary/40'}`}
                      />
                      <motion.div 
                        layoutId="sequencerPulse"
                        className={`absolute inset-0 ${active ? 'bg-white/40' : 'bg-primary/20'}`} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Constant pulse for active steps during playback */}
                {active && state.isPlaying && (
                   <motion.div 
                     animate={{ opacity: [0.3, 0.6, 0.3] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="absolute inset-x-0 bottom-0 h-1 bg-white/30"
                   />
                )}

                <span className={`font-headline text-[10px] font-bold z-10 transition-transform ${state.currentStep === i ? "scale-125" : ""} ${active ? "text-on-primary-container" : "text-outline/40 group-hover:text-outline"}`}>
                  {i + 1}
                </span>
                
                {/* Hit indicator dot */}
                {active && (
                   <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-white/60" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 text-outline font-headline text-[10px] tracking-widest">
            <span className="bg-surface-container-low px-2 py-1 rounded">16 STEPS</span>
            <span className="bg-surface-container-low px-2 py-1 rounded">1/16 QUANTIZE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoutingView = () => {
  const sources: RoutingSource[] = [
    { id: '1', name: 'YouTube Tab - Lofi Beats', active: true, inputBus: 'BUS 1-2', virtualOut: 'MIXER_CH_1' },
    { id: '2', name: 'Spotify Web Player', active: false, inputBus: 'BUS 3-4', virtualOut: 'MIXER_CH_2' },
    { id: '3', name: 'System Audio', active: true, inputBus: 'SYS_1-2', virtualOut: 'MASTER' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-y-auto md:overflow-hidden lg:p-8 custom-scrollbar">
      <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center relative bg-surface-container-high/20 rounded-3xl border border-white/5 p-8 lg:p-12">
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none" aria-hidden="true">
          <RouteIcon className="w-48 h-48 md:w-[400px] md:h-[400px]" />
        </div>
        <div className="glass-panel p-8 md:p-12 rounded-2xl border-t border-primary/20 shadow-2xl text-center max-w-md glow-primary">
          <RouteIcon className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-6 drop-shadow-[0_0_15px_#8ed5ff]" />
          <h2 className="font-headline text-xl md:text-2xl font-bold mb-4 tracking-tight">MATRIX_CANVAS_v1</h2>
          <p className="font-body text-xs md:text-sm text-outline mb-8">Establish signal pathways across the virtual matrix bus. Select input nodes to patch into destination channels.</p>
          <div className="flex justify-center gap-4 md:gap-6 font-headline text-[8px] md:text-[10px] tracking-widest text-outline uppercase border-t border-white/5 pt-6">
            <span>SYSTEM_READY</span>
            <span>•</span>
            <span>LATENCY_0.4MS</span>
          </div>
        </div>
      </div>

      <aside className="w-full md:w-80 lg:w-96 flex flex-col bg-surface-container-high/40 rounded-3xl border border-white/10 p-6 backdrop-blur-2xl shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="mb-8">
           <h3 className="font-headline font-black text-primary text-xl tracking-tighter glow-text">PATCH_MATRIX_HUB</h3>
           <p className="font-headline text-[10px] text-outline tracking-widest uppercase mt-1">BUS_ROUTING_BAY</p>
        </div>
        
        <div className="flex-1 flex flex-col gap-4 overflow-y-visible pr-2">
          <span className="font-headline text-[9px] md:text-[10px] text-outline/50 tracking-widest uppercase mb-2">ACTIVE_SOURCES</span>
          {sources.map(source => (
            <div key={source.id} className={`p-4 rounded-xl border-t border-white/5 transition-all ${source.active ? 'bg-surface-container-low border-primary/20' : 'bg-surface-container-lowest opacity-40'}`}>
              <div className="flex justify-between items-center mb-4 gap-4">
                 <div className="flex items-center gap-2 overflow-hidden">
                    {source.id === '1' ? <Monitor className="w-4 h-4 text-outline flex-shrink-0" /> : <Music className="w-4 h-4 text-outline flex-shrink-0" />}
                    <span className="font-body text-xs md:text-sm font-medium truncate">{source.name}</span>
                 </div>
                 <button 
                  aria-label={`Toggle routing for ${source.name}`}
                  aria-pressed={source.active}
                  className={`w-8 h-4 rounded-full relative transition-all flex-shrink-0 ${source.active ? 'bg-primary shadow-[0_0_10px_#38bdf8]' : 'bg-surface-container-highest'}`}
                 >
                   <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all ${source.active ? 'right-0.5' : 'left-0.5'}`} />
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label id={`input-bus-label-${source.id}`} className="font-headline text-[8px] text-outline tracking-widest uppercase block">INPUT_BUS</label>
                   <button 
                    aria-labelledby={`input-bus-label-${source.id}`}
                    className="w-full flex items-center justify-between text-[10px] font-bold text-white bg-black/20 p-2 rounded cursor-pointer group focus:ring-2 focus:ring-primary/50"
                   >
                     {source.inputBus} <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-100" />
                   </button>
                 </div>
                 <div className="space-y-1">
                   <label id={`virtual-out-label-${source.id}`} className="font-headline text-[8px] text-outline tracking-widest uppercase block">VIRTUAL_OUT</label>
                   <button 
                    aria-labelledby={`virtual-out-label-${source.id}`}
                    className="w-full flex items-center justify-between text-[10px] font-bold text-white bg-black/20 p-2 rounded cursor-pointer group focus:ring-2 focus:ring-primary/50"
                   >
                     {source.virtualOut} <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-100" />
                   </button>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 sticky bottom-0 bg-surface-container-high/80 pt-4 border-t border-white/5">
          <button className="flex-1 bg-surface-container-highest/40 border border-white/5 text-outline py-3 md:py-4 rounded-xl font-headline text-[10px] tracking-widest hover:text-white transition-all uppercase active:scale-95">RESET</button>
          <button className="flex-[2] bg-gradient-to-br from-primary to-primary-container text-on-primary-container py-3 md:py-4 rounded-xl font-headline font-black text-[10px] tracking-widest shadow-lg hover:shadow-primary/20 transition-all uppercase active:scale-95">DEPLOY</button>
        </div>
      </aside>
    </div>
  );
};

const LibraryView = () => {
  const presets = [
    { title: "Deep Space Lead", author: "Architect", tags: ["120 BPM", "POLY SYNTH"], active: true },
    { title: "Neon Kick", author: "VoidDrums", tags: ["ONE SHOT", "DRUM"], active: false },
    { title: "Ethereal Pad", author: "CloudWalker", tags: ["AMBIENT", "TEXTURE"], active: false },
  ];

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0 bg-surface">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-6 md:mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center sticky top-0 bg-surface/80 backdrop-blur-xl z-20 pb-4">
           <div className="flex-1 w-full bg-surface-container-low rounded-xl border border-white/5 flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all group max-w-xl">
             <Settings className="w-5 h-5 text-outline mr-3 group-hover:text-primary transition-colors" aria-hidden="true" />
             <input 
              type="text" 
              placeholder="QUERY_REGISTRY..." 
              aria-label="Search available synth patches and presets"
              className="bg-transparent border-none outline-none text-white font-headline text-sm w-full placeholder:text-outline/30" 
             />
           </div>
           <div className="flex flex-wrap gap-2">
             {['ATMOS', 'KINETIC', 'TECH', 'GRAVITY'].map(tag => (
               <button key={tag} className={`px-4 py-1.5 rounded-full font-headline text-[9px] md:text-[10px] tracking-widest uppercase border transition-all active:scale-95 ${
                 tag === 'ATMOS' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-surface-container-high border-white/5 text-outline hover:text-white hover:border-primary/20'
               }`}>
                 {tag}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
          {presets.map(p => (
            <button 
              key={p.title} 
              aria-label={`Preset: ${p.title} by ${p.author}. ${p.active ? 'Current selection' : 'Click to select'}`}
              className={`p-5 md:p-6 rounded-3xl transition-all duration-300 relative overflow-hidden group text-left focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                p.active ? 'bg-surface-container-high border-t border-primary/20 shadow-2xl scale-[1.02]' : 'bg-surface-container-low border border-white/5 hover:bg-surface-container-high hover:scale-[1.01]'
              }`}
            >
              <div className="flex justify-between items-start mb-4 md:mb-6">
                 <div>
                   <h3 className={`font-headline text-base md:text-lg font-black mb-1 leading-none ${p.active ? 'text-primary glow-text' : 'text-white group-hover:text-primary transition-colors'}`}>{p.title}</h3>
                   <p className="text-[9px] text-outline font-headline uppercase tracking-tighter">by {p.author}</p>
                 </div>
                 {p.active && <Plus className="w-4 h-4 text-tertiary" aria-hidden="true" />}
              </div>
              <div className="h-16 w-full bg-black/40 rounded-xl mb-6 flex items-end justify-center gap-1.5 overflow-hidden p-2 shadow-inner">
                 {[1,2,3,4,5,6,7,8,9,10].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: p.active ? [20, 48, 24, 56, 30] : 8 }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: p.active ? (0.8 + i * 0.1) : 2,
                        delay: i * 0.05
                      }}
                      className={`w-1 rounded-full ${p.active ? 'bg-primary shadow-[0_0_10px_#38bdf8]' : 'bg-outline/10'}`} 
                    />
                 ))}
              </div>
              <div className="flex flex-wrap gap-2 font-headline text-[8px] text-outline tracking-[0.2em] uppercase">
                {p.tags.map(t => <span key={t} className="bg-white/5 px-2 py-0.5 rounded">{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <aside className="w-full xl:w-96 bg-surface-container-low/40 border-l border-white/10 p-6 md:p-8 flex flex-col backdrop-blur-3xl shadow-2xl xl:static fixed inset-y-0 right-0 z-40 translate-x-full xl:translate-x-0 transition-transform">
         <div className="mb-2">
            <span className="font-headline text-[10px] text-primary tracking-[0.3em] font-black uppercase">PATCH_SPEC_v4</span>
         </div>
         <h2 className="font-headline text-2xl md:text-3xl text-white font-black tracking-tighter glow-text mb-4 uppercase">DEEP_SPACE_LEAD</h2>
         <p className="font-body text-sm text-outline mb-10 leading-relaxed font-light">A dense, evolving polyphonic synthesizer patch perfect for cinematic scores and deep techno breakdowns.</p>
         
         <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-black/20 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-4 border border-white/5 group hover:border-primary/40 transition-all cursor-pointer">
               <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-outline/20 relative flex items-center justify-center group-hover:border-primary/40 transition-all">
                  <div className="absolute top-2 w-1.5 h-5 bg-primary rounded-full origin-bottom rotate-45 shadow-[0_0_10px_#38bdf8]" />
               </div>
               <span className="font-headline text-[8px] md:text-[9px] text-outline tracking-wider font-bold uppercase">CUTOFF</span>
            </div>
             <div className="bg-black/20 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-4 border border-white/5 group hover:border-tertiary/40 transition-all cursor-pointer">
               <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-outline/20 relative flex items-center justify-center group-hover:border-tertiary/40 transition-all">
                  <div className="absolute top-2 w-1.5 h-5 bg-tertiary rounded-full origin-bottom -rotate-45 shadow-[0_0_10px_#56e5a9]" />
               </div>
               <span className="font-headline text-[8px] md:text-[9px] text-outline tracking-wider font-bold text-center uppercase">RESONANCE</span>
            </div>
         </div>

         <button className="mt-auto bg-primary hover:bg-white text-on-primary-container py-4 md:py-5 rounded-2xl font-headline font-black text-xs tracking-widest shadow-2xl active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-3">
            <Plus className="w-4 h-4" />
            ADD_TO_SESSION
         </button>
      </aside>
    </div>
  );
};

const ProjectorView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      videoEngine.init(canvasRef.current);
    }
    return () => videoEngine.stopRender();
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full object-contain" width={1920} height={1080} />
      <div className="absolute top-4 left-4 font-headline text-[8px] text-primary/30 uppercase tracking-[0.4em]">EXTREAMIX_REMOTE_NODE</div>
    </div>
  );
};

// --- Main App Implementation ---

export default function App() {
  const isProjector = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('projector') === 'true';
  const [currentView, setCurrentView] = useState<View>('mixer');
  const [channels, setChannels] = useState<ChannelState[]>([
    { id: 'ch-1', name: 'V-Synth', volume: 0.7, pan: 0, depth: 0, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 } },
    { id: 'ch-2', name: 'Drum Mach', volume: 0.8, pan: 0.2, depth: 0.1, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 } },
    { id: 'ch-3', name: 'Arp Bass', volume: 0.5, pan: -0.3, depth: 0.5, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 } },
    { id: 'ch-4', name: 'Vocal Vox', volume: 0.6, pan: 0, depth: -0.2, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 } },
  ]);
  const [transcripts, setTranscripts] = useState<string[]>(["Awaiting audio stream for speech recognition..."]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleTranscribe = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscripts(prev => [...prev, "Error: Speech API not supported in this browser."]);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsTranscribing(true);
        setTranscripts(prev => [...prev, "System: Live transcription session started."]);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscripts(prev => [...prev, finalTranscript]);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsTranscribing(false);
      };

      recognition.onend = () => {
        setIsTranscribing(false);
        setTranscripts(prev => [...prev, "System: Transcription session ended."]);
      };

      recognitionRef.current = recognition;
    }

    if (isTranscribing) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  };

  const [sequencer, setSequencer] = useState<SequencerState>({
    steps: [true, false, false, true, false, false, true, false, true, true, false, false, false, true, false, true],
    bpm: 120,
    currentStep: -1,
    isPlaying: false
  });
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);

  useEffect(() => {
    extreamixEngine.init();
    channels.forEach(ch => extreamixEngine.createChannel(ch.id, ch));
    
    extreamixEngine.onStep = (step) => {
      setSequencer(prev => ({ ...prev, currentStep: step }));
    };
  }, []);

  const handleRouteExternalTab = async () => {
    try {
      // @ts-ignore - getDisplayMedia might not be in the type definitions for all environments
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop(); // We only want audio
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        extreamixEngine.routeStreamToChannel(stream, 'ch-1');
        // Update transcription to show something happened
        setChannels(prev => prev.map(ch => ch.id === 'ch-1' ? { ...ch, name: 'EXTERNAL AUDIO' } : ch));
      }
    } catch (err) {
      console.error('Routing failed:', err);
    }
  };

  const handlePlay = () => {
    if (sequencer.isPlaying) {
      extreamixEngine.stopSequencer();
      setSequencer(prev => ({ ...prev, isPlaying: false, currentStep: -1 }));
    } else {
      extreamixEngine.startSequencer(sequencer.bpm, sequencer.steps);
      setSequencer(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const handleAddVideoSource = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      const defaultChannelId = 'ch-1';
      const source = videoEngine.addSource(stream, `Visual Source ${videoSources.length + 1}`);
      source.audioChannelId = stream.getAudioTracks().length > 0 ? defaultChannelId : undefined;
      
      setVideoSources(prev => [...prev, source]);
      
      // If audio exists, route it too
      if (source.audioChannelId) {
        extreamixEngine.routeStreamToChannel(stream, source.audioChannelId, source.id);
      }
    } catch (err) {
      console.error('Failed to add video source:', err);
    }
  };

  const updateVideoSource = (id: string, update: Partial<VideoSource>) => {
    const existing = videoSources.find(s => s.id === id);
    if (!existing) return;

    if (update.audioChannelId !== undefined && update.audioChannelId !== existing.audioChannelId) {
      if (update.audioChannelId) {
        extreamixEngine.routeStreamToChannel(existing.stream, update.audioChannelId, id);
      }
    }

    videoEngine.updateSource(id, update);
    setVideoSources(videoEngine.getSources());
  };

  const updateChannel = (id: string, update: Partial<ChannelState>) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        const next = { ...ch, ...update };
        extreamixEngine.updateChannel(id, next);
        return next;
      }
      return ch;
    }));
  };

  const toggleStep = (i: number) => {
    const nextSteps = [...sequencer.steps];
    nextSteps[i] = !nextSteps[i];
    setSequencer(prev => ({ ...prev, steps: nextSteps }));
  };

  if (isProjector) {
    return <ProjectorView />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-surface overflow-hidden">
      {/* Top Bar - Simplified for mobile */}
      <header className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center gap-4 md:gap-12">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-2xl font-black text-primary italic font-headline tracking-tighter glow-text leading-none">EXTREAMIX</h1>
            <div className="flex items-center gap-2 mt-1 hidden sm:flex">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-headline text-[7px] text-outline tracking-[0.2em] font-black uppercase">CORE_ENGINE_v4 // STATUS_NOMINAL</span>
            </div>
          </div>
          <nav className="hidden xl:flex items-center gap-8">
            {['PROJ_INF', 'EXP_LOG', 'SYS_CFG'].map((item, i) => (
              <button key={item} className={`font-headline text-[10px] tracking-[0.2em] font-bold ${item === 'SYS_CFG' ? 'text-primary' : 'text-outline hover:text-white transition-colors'}`}>
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-white/5 rounded-xl border border-white/5 mx-4">
           {[
             { label: 'SAMP', val: '48.0' },
             { label: 'LAT', val: '0.4MS' },
             { label: 'BUF', val: '2048' }
           ].map(stat => (
             <div key={stat.label} className="flex flex-col items-center">
               <span className="font-headline text-[6px] text-outline tracking-widest leading-none mb-1 uppercase">{stat.label}</span>
               <span className="font-mono text-[9px] text-white font-black leading-none">{stat.val}</span>
             </div>
           ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center bg-surface-container-high rounded-xl overflow-hidden shadow-2xl scale-90 md:scale-100">
            <button 
              onClick={handlePlay}
              className={`px-4 md:px-6 py-2 flex md:py-2.5 items-center gap-2 font-headline font-black text-[10px] md:text-xs transition-all ${
                sequencer.isPlaying ? 'bg-error text-on-error animate-pulse' : 'bg-primary text-on-primary-container'
              }`}
            >
              {sequencer.isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span className="hidden sm:inline">{sequencer.isPlaying ? 'STOP' : 'PLAY'}</span>
            </button>
            <div className="px-2 md:px-4 border-l border-white/10 flex items-center gap-2">
              <input 
                type="number" 
                value={sequencer.bpm}
                onChange={e => setSequencer(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                className="w-10 bg-transparent border-none text-white font-headline font-bold text-[10px] md:text-xs focus:ring-0 text-center p-0"
              />
              <span className="text-[8px] md:text-[9px] text-outline font-headline font-bold">BPM</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={handleRouteExternalTab}
              aria-label="Route External Tab"
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white p-2 md:px-4 md:py-2 rounded-lg font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden md:inline">Route</span>
            </button>
            <button 
              onClick={handleTranscribe}
              aria-label="Transcribe Audio"
              className={`p-2 md:px-4 md:py-2 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center gap-2 ${
                isTranscribing ? 'bg-error text-on-error animate-pulse shadow-[0_0_15px_#ffb4ab]' : 'bg-surface-container-highest hover:bg-surface-variant border border-white/10 text-white'
              }`}
            >
              {isTranscribing ? <div className="w-2 h-2 rounded-full bg-current animate-pulse" /> : <Mic2 className="w-4 h-4 text-outline" />}
              <span className="hidden md:inline">{isTranscribing ? 'Recording...' : 'Transcribe'}</span>
            </button>
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-1 md:mx-2 hidden sm:block" />
          <div className="flex items-center gap-1">
            <IconButton icon={Settings} label="General Settings" className="scale-90 md:scale-100" />
            <div className="w-8 h-8 rounded-full border border-primary/30 ml-2 md:ml-4 overflow-hidden relative flex-shrink-0">
               <img src="https://picsum.photos/seed/sonicuser/64/64" alt="User Profile Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative pb-16 md:pb-0">
        {/* Navigation - Bottom bar on mobile, Sidebar on desktop */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-container-high/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-40 transition-all md:relative md:w-20 lg:w-24 md:h-full md:flex-col md:border-t-0 md:border-r md:justify-start md:py-8 lg:p-0">
           <div className="hidden md:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-surface-container-high border border-primary/20 items-center justify-center mb-4">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <div className="flex md:flex-col w-full md:space-y-2 md:flex-1">
            <NavItem icon={SlidersHorizontal} label="Console" active={currentView === 'mixer'} onClick={() => setCurrentView('mixer')} />
            <NavItem icon={Video} label="Imaging" active={currentView === 'vision'} onClick={() => setCurrentView('vision')} />
            <NavItem icon={LayoutGrid} label="Pulse" active={currentView === 'sequencer'} onClick={() => setCurrentView('sequencer')} />
            <NavItem icon={RouteIcon} label="Matrix" active={currentView === 'routing'} onClick={() => setCurrentView('routing')} />
            <NavItem icon={LibraryIcon} label="Registry" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
          </div>

          <div className="hidden md:flex flex-col items-center mt-auto space-y-4 w-full">
            <button className="mx-auto w-16 h-8 rounded border border-primary/30 text-primary font-headline text-[9px] font-bold hover:bg-primary/10 transition-all">ADD_TRK</button>
            <NavItem icon={Settings} label="Help" active={false} onClick={() => {}} />
          </div>
        </nav>

        {/* Workspace */}
        <main className="flex-1 overflow-hidden flex flex-col p-2 md:p-6 lg:p-8 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.005] pointer-events-none select-none">
            <span className="font-headline text-[20rem] md:text-[40rem] font-black pointer-events-none uppercase">{currentView}</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col z-10"
            >
              {currentView === 'mixer' && <MixerView channels={channels} updateChannel={updateChannel} transcripts={transcripts} />}
              {currentView === 'vision' && <VisionView sources={videoSources} onUpdate={updateVideoSource} onAdd={handleAddVideoSource} channels={channels} />}
              {currentView === 'sequencer' && <SequencerView state={sequencer} toggleStep={toggleStep} />}
              {currentView === 'routing' && <RoutingView />}
              {currentView === 'library' && <LibraryView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer / Preview Strip - Hidden on small mobile */}
      <footer className="h-14 md:h-20 px-4 md:px-8 bg-surface-container-high/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between z-30 hidden sm:flex">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={handlePlay}
            aria-label={sequencer.isPlaying ? "Stop sequence" : "Play sequence"}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all ${
            sequencer.isPlaying ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-surface-container-low border-white/10 text-outline'
          }`}>
             {sequencer.isPlaying ? <Square className="w-4 h-4 md:w-5 md:h-5 fill-current" aria-hidden="true" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" aria-hidden="true" />}
          </button>
          <div className="hidden sm:block">
            <div className="font-headline text-[10px] md:text-sm font-bold text-primary truncate max-w-[120px] md:max-w-[200px]">LIVE_STREAM_BUFFER</div>
            <div className="font-headline text-[8px] md:text-[10px] text-outline uppercase tracking-widest">Master Feed • 48kHz / 24bit</div>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-12">
           <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
              <VUMeter analyser={extreamixEngine.getMasterAnalyser()} orientation="horizontal" className="w-32 h-2" />
           </div>
           
           <div className="flex items-center gap-2">
              <IconButton icon={Settings} label="Output Settings" className="hidden sm:flex" />
              <IconButton icon={Zap} label="Quick Actions" />
           </div>
        </div>
      </footer>
    </div>
  );
}

