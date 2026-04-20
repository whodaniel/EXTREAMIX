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
  Tv,
  Clock,
  Waves,
  Disc,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, ChannelState, SequencerState, RoutingSource, VideoSource, RoutingDestination, RoutingConnection, CrossoverState, MatrixMapping, RegistryPreset, PulseTrack, FXState } from './types';
import { audioEngine } from './services/audioEngine';
import { videoEngine } from './services/videoEngine';
import { LandingPage } from './components/LandingPage';

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

const ImagingView = ({ 
  sources, 
  onUpdate, 
  onAdd, 
  channels,
  activeSourceId,
  sequencer
}: { 
  sources: VideoSource[], 
  onUpdate: (id: string, update: Partial<VideoSource>) => void, 
  onAdd: () => void, 
  channels: ChannelState[],
  activeSourceId: string | null,
  sequencer: SequencerState
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [screens, setScreens] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (activeSourceId && scrollContainerRef.current) {
      // Small delay to allow layout to settle
      setTimeout(() => {
        const el = document.getElementById(`vis-config-${activeSourceId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [activeSourceId]);

  useEffect(() => {
    if (canvasRef.current) {
      videoEngine.init(canvasRef.current);
      try {
        // @ts-ignore
        window.extreamixMainStream = canvasRef.current.captureStream(30);
      } catch(e) {
        console.warn("Could not capture stream from canvas", e);
      }
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

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleLaunchProjector = (screen?: any) => {
    const width = 1280;
    const height = 720;
    const left = screen ? screen.availLeft + (screen.availWidth - width) / 2 : (window.screen.width - width) / 2;
    const top = screen ? screen.availTop + (screen.availHeight - height) / 2 : (window.screen.height - height) / 2;
    
    window.open(
      `${window.location.origin}/?projector=true`, 
      'ImagingProjector', 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,location=no`
    );
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 overflow-y-auto xl:overflow-hidden min-h-0 p-2 md:p-4 custom-scrollbar lg:pb-20 xl:pb-0">
      {/* Main Canvas Monitor */}
      <div 
        ref={containerRef}
        className="flex-[3] min-h-[300px] md:min-h-[400px] xl:min-h-0 bg-black rounded-3xl border border-white/10 overflow-hidden relative group shadow-2xl"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain" 
          width={1920} height={1080} 
          role="img" 
          aria-label="Imaging Module WebGL Canvas"
        />
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-1 pointer-events-none">
          <div className="font-headline text-[9px] md:text-[10px] text-tertiary bg-black/60 px-3 py-1 rounded-full border border-tertiary/20 tracking-widest uppercase backdrop-blur-md">
            IMAGING_OUT // WEBGL2
          </div>
          <div className="font-headline text-[8px] text-outline px-3 tracking-widest uppercase hidden sm:block">
            HARDWARE_ACCELERATED
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2 md:gap-3">
           <button onClick={handleFullscreen} className="bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md transition-all active:scale-95">
             <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
           </button>
           <button onClick={onAdd} className="bg-tertiary hover:bg-white text-on-tertiary-container px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-headline font-black text-[10px] md:text-xs flex items-center gap-2 shadow-[0_20px_50px_rgba(86,229,169,0.3)] active:scale-95 transition-all uppercase tracking-widest">
             <Plus className="w-4 h-4" />
             <span className="hidden sm:inline">INJECT_FEED</span>
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
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none italic glow-text">IMAGING_HUB</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Multi-Spectral Blending</span>
           </div>
           <Zap className="w-4 h-4 md:w-5 md:h-5 text-tertiary animate-pulse" />
        </div>

        <div ref={scrollContainerRef} className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
           {/* Interactions Help */}
           <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 md:p-4 text-[8px] md:text-[10px] text-primary/80 font-mono uppercase leading-relaxed tracking-wider">
              [DRAG] TO POSITION // [RESIZE_HANDLE] BOTTOM-RIGHT
              <br />
              [Z_KEY] + [DRAG] TO SHIFT_Z_DEPTH (Z-INDEX)
           </div>

           {/* Output Monitor Selection */}
           <div className="bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-tertiary/20 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Tv className="w-4 h-4 md:w-5 md:h-5 text-tertiary" />
                <h4 className="font-headline text-[9px] md:text-[10px] text-white tracking-[0.2em] font-black uppercase font-bold">Projector_Hub</h4>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleLaunchProjector()}
                    className="flex-1 flex items-center justify-between bg-surface-container-highest/50 hover:bg-surface-container-highest p-3 md:p-4 rounded-xl border border-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 text-outline" />
                      <span className="font-headline text-[9px] md:text-[10px] text-white uppercase">Pop-out</span>
                    </div>
                  </button>
                  <button 
                    onClick={onAdd}
                    className="flex-1 flex items-center justify-between bg-tertiary/20 hover:bg-tertiary/40 p-3 md:p-4 rounded-xl border border-tertiary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-tertiary" />
                      <span className="font-headline text-[9px] md:text-[10px] text-white uppercase">Inject Feed</span>
                    </div>
                  </button>
                </div>

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

            {sources.map(source => {
              const isSelected = activeSourceId === source.id;
              return (
              <motion.div 
                 key={source.id} 
                 id={`vis-config-${source.id}`}
                 initial={false}
                 animate={isSelected ? { scale: [1, 1.02, 1], borderColor: 'rgba(56,189,248,0.5)' } : { scale: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                 transition={{ duration: 0.5 }}
                 className={`rounded-2xl p-5 border space-y-6 transition-colors group ${
                   isSelected ? 'bg-primary/10 shadow-[0_0_30px_rgba(56,189,248,0.15)] outline outline-2 outline-primary/20' : 'bg-surface-container-low/50 hover:bg-surface-container-low'
                 }`}
              >
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
                  <div className="font-headline text-[9px] text-outline uppercase tracking-wider flex justify-between">
                    <span>Pulse Routing Latch</span>
                    {source.pulseRouting && source.pulseRouting.length > 0 && <span className="text-primary animate-pulse font-black text-[7px]">FILTERED_SIGNAL</span>}
                  </div>
                  <select 
                    multiple
                    value={source.pulseRouting || []}
                    onChange={e => {
                      const vals = Array.from(e.target.selectedOptions).map((option: any) => option.value);
                      onUpdate(source.id, { pulseRouting: vals });
                    }}
                    className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-2 py-2 text-[10px] text-white outline-none cursor-pointer hover:border-primary/30 transition-all font-mono uppercase tracking-wider min-h-[80px] custom-scrollbar focus:ring-1 focus:ring-primary/40"
                  >
                    {sequencer.tracks.map(t => (
                      <option key={t.id} value={t.id} className="p-1">{t.name} [{t.id.toUpperCase()}]</option>
                    ))}
                  </select>
                  <div className="text-[8px] text-outline mt-1 font-mono uppercase leading-tight">Cmd/Ctrl-Click to multi-select. Select none to UNLATCH.</div>
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
              </motion.div>
            );
            })}

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

const ConsoleView = ({ 
  channels, 
  updateChannel, 
  transcripts, 
  masterLimiterActive,
  crossoverGates,
  toggleCrossoverGate,
  onTranscribe,
  isTranscribing,
  sequencer,
  setSequencer
}: { 
  channels: ChannelState[], 
  updateChannel: (id: string, state: Partial<ChannelState>) => void, 
  transcripts: string[],
  masterLimiterActive: boolean,
  crossoverGates: CrossoverState,
  toggleCrossoverGate: (gate: keyof CrossoverState) => void,
  onTranscribe: () => void,
  isTranscribing: boolean,
  sequencer: SequencerState,
  setSequencer: React.Dispatch<React.SetStateAction<SequencerState>>
}) => {
  const mixerCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = mixerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const draw = () => {
      const analyser = audioEngine.getMasterAnalyser();
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
        className="flex-[2.5] bg-surface-container-high/20 backdrop-blur-3xl rounded-3xl border border-white/10 p-4 md:p-6 flex flex-col gap-6 overflow-hidden min-h-[400px] md:min-h-[500px] xl:min-h-0 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
           <div>
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none italic glow-text">SIGNAL_CONSOLE_v4</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Core Audio Mixing Engine</span>
           </div>
           
           <div className="flex items-center gap-6">
              {/* Master Volume Fader */}
              <div className="flex flex-col items-center gap-1 bg-black/40 border border-white/5 px-4 py-1.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-3 h-3 text-primary" />
                  <input 
                    type="range" min="0" max="1.5" step="0.01" 
                    value={sequencer.masterVolume}
                    onChange={e => {
                       const val = parseFloat(e.target.value);
                       audioEngine.setMasterVolume(val);
                       setSequencer(prev => ({ ...prev, masterVolume: val }));
                    }}
                    className="w-24 h-1 bg-surface-container-highest appearance-none rounded-full accent-primary cursor-pointer"
                  />
                </div>
                <span className="font-mono text-[7px] text-outline uppercase font-bold tracking-widest whitespace-nowrap">MASTER_OUT: {Math.round(sequencer.masterVolume * 100)}%</span>
              </div>

              {/* Master Limiter LED */}
              <div className="flex bg-black/40 border border-white/5 px-3 py-1.5 rounded-full items-center gap-2 relative">
                <span className="font-mono text-[8px] tracking-widest text-outline uppercase font-bold">BRICKWALL</span>
                <div className={`w-2 h-2 rounded-full transition-colors duration-100 ${masterLimiterActive ? 'bg-error shadow-[0_0_15px_#f87171]' : 'bg-surface-container-highest'}`} />
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="font-mono text-[9px] text-primary font-black uppercase">LIVE_MIX</span>
              </div>
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
                    analyser={audioEngine.getChannelAnalyser(channel.id)} 
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

                {/* Pulse Latch */}
                <div className="z-10 bg-black/20 p-2 rounded-xl border border-white/5 flex flex-col gap-1">
                  <div className="font-headline text-[7px] text-outline uppercase tracking-wider flex justify-between">
                    <span>SIGNAL_GATE</span>
                    {channel.pulseRouting && channel.pulseRouting.length > 0 && <span className="text-primary animate-pulse font-black">QUANTIZED</span>}
                  </div>
                  <select 
                    multiple
                    value={channel.pulseRouting || []}
                    onChange={e => {
                      const vals = Array.from(e.target.selectedOptions).map((option: any) => option.value);
                      updateChannel(channel.id, { pulseRouting: vals });
                    }}
                    className="w-full bg-transparent border-none text-[8px] text-white outline-none cursor-pointer font-mono uppercase tracking-tighter min-h-[40px] custom-scrollbar focus:ring-0"
                  >
                    {sequencer.tracks.map(t => (
                      <option key={t.id} value={t.id} className="py-0.5">{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* FX Shortcut Bar */}
                <div className="z-10 bg-black/40 p-2 rounded-xl border border-white/5 flex justify-around">
                   {[
                     { id: 'delay' as const, icon: Clock, label: 'DLY' },
                     { id: 'reverb' as const, icon: Waves, label: 'RVB' },
                     { id: 'chorus' as const, icon: Disc, label: 'CHO' },
                     { id: 'phaser' as const, icon: Wind, label: 'PHS' }
                   ].map(fx => (
                     <button
                       key={fx.id}
                       onClick={() => {
                          const current = channel.fx[fx.id];
                          updateChannel(channel.id, { 
                            fx: { ...channel.fx, [fx.id]: { ...current, active: !current.active } } 
                          });
                       }}
                       title={fx.label}
                       className={`p-1.5 rounded-md transition-all flex flex-col items-center gap-0.5 ${channel.fx[fx.id].active ? 'bg-primary text-on-primary shadow-[0_0_8px_#38bdf8]' : 'bg-white/5 text-outline opacity-40 hover:opacity-100'}`}
                     >
                        <fx.icon className="w-3 h-3" />
                        <span className="text-[6px] font-black">{fx.label}</span>
                     </button>
                   ))}
                </div>

                {/* Detailed FX Controls (mini) */}
                <div className="z-10 grid grid-cols-2 gap-2 bg-surface-container-lowest/30 p-2 rounded-xl">
                   <div className="flex flex-col gap-1">
                      <div className="font-headline text-[6px] text-outline uppercase tracking-widest">Pitch_Corr</div>
                      <input 
                        type="range" min="0" max="1" step="0.01" value={channel.pitchCorrection}
                        onChange={e => updateChannel(channel.id, { pitchCorrection: parseFloat(e.target.value) })}
                        className="w-full h-0.5 bg-surface-container-highest appearance-none rounded-full accent-tertiary cursor-pointer"
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <div className="font-headline text-[6px] text-outline uppercase tracking-widest">Beat_Corr</div>
                      <input 
                        type="range" min="0" max="1" step="0.01" value={channel.beatCorrection}
                        onChange={e => updateChannel(channel.id, { beatCorrection: parseFloat(e.target.value) })}
                        className="w-full h-0.5 bg-surface-container-highest appearance-none rounded-full accent-tertiary cursor-pointer"
                      />
                   </div>
                </div>
            </div>
          ))}

          {/* GLOBAL MASTER CHANNEL STRIP */}
          <div className="w-[110px] shrink-0 flex flex-col gap-4 bg-primary/[0.03] rounded-[2.5rem] border border-primary/20 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Zap className="w-4 h-4 text-primary" /></div>
              
              <div className="flex flex-col items-center z-10">
                <div className="font-headline text-[9px] text-primary tracking-[0.3em] mb-1 uppercase">SIGNAL_SUM</div>
                <h4 className="font-headline text-sm text-white font-black uppercase glow-text">MASTER</h4>
              </div>

              <div className="flex-1 flex gap-2 z-10 min-h-0">
                 {/* Master VU & Fader */}
                 <div className="flex-1 bg-black/40 rounded-2xl p-2 flex items-stretch gap-2 border border-white/5">
                    <VUMeter analyser={audioEngine.getMasterAnalyser()} orientation="vertical" className="w-1.5 h-full opacity-100" />
                    
                    <div className="flex-1 flex flex-col items-center relative">
                       <input 
                        type="range" min="0" max="1.5" step="0.01" 
                        value={sequencer.masterVolume}
                        onChange={e => {
                           const val = parseFloat(e.target.value);
                           setSequencer(prev => ({ ...prev, masterVolume: val }));
                        }}
                        className="h-full w-2 appearance-none bg-surface-container-highest rounded-full accent-primary [writing-mode:bt-lr] -webkit-appearance-slider-vertical cursor-pointer"
                        style={{ WebkitAppearance: 'slider-vertical' } as any}
                      />
                    </div>
                 </div>

                 {/* MASTER FX SHORTCUTS */}
                 <div className="w-8 flex flex-col justify-around bg-black/40 rounded-xl py-2 border border-white/5">
                    {[
                       { id: 'delay' as const, icon: Clock, label: 'DLY' },
                       { id: 'reverb' as const, icon: Waves, label: 'RVB' },
                       { id: 'chorus' as const, icon: Disc, label: 'CHO' },
                       { id: 'phaser' as const, icon: Wind, label: 'PHS' }
                    ].map(fx => {
                       const isActive = sequencer.masterFX[fx.id].active;
                       return (
                          <button
                             key={fx.id}
                             onClick={() => setSequencer(prev => ({
                                ...prev,
                                masterFX: { ...prev.masterFX, [fx.id]: { ...prev.masterFX[fx.id], active: !isActive } }
                             }))}
                             title={`MASTER_${fx.label}`}
                             className={`mx-1 p-1 rounded-lg transition-all flex flex-col items-center gap-0.5 ${isActive ? 'bg-primary text-on-primary shadow-[0_0_8px_#38bdf8]' : 'bg-white/5 text-outline opacity-40 hover:opacity-100'}`}
                          >
                             <fx.icon className="w-2.5 h-2.5" />
                             <span className="text-[5px] font-black">{fx.label}</span>
                          </button>
                       );
                    })}
                 </div>
              </div>

              <div className="z-10 flex flex-col gap-2">
                 <div className="bg-black/60 p-2 rounded-xl border border-error/30 flex flex-col gap-1 items-center">
                    <div className="flex justify-between w-full px-1">
                       <span className="font-mono text-[7px] text-error font-black tracking-widest uppercase">LIMITER</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${masterLimiterActive ? 'bg-error animate-ping' : 'bg-white/10'}`} />
                    </div>
                    <div className={`w-full h-1 rounded-full transition-all duration-75 ${masterLimiterActive ? 'bg-error shadow-[0_0_10px_#f87171]' : 'bg-white/5'}`} />
                 </div>

                 <div className="bg-primary/90 text-white rounded-xl p-2 text-center shadow-[0_10px_20px_rgba(56,189,248,0.3)]">
                    <div className="font-mono text-[10px] font-black tracking-tighter leading-none">{Math.round(sequencer.masterVolume * 100)}%</div>
                    <div className="font-headline text-[6px] font-black uppercase tracking-widest mt-1 opacity-70">GAIN_DB</div>
                 </div>
              </div>

              {/* Aesthetic background glow */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Side Monitor Area */}
      <div 
        className="flex-1 flex flex-col gap-6 overflow-y-auto xl:overflow-hidden min-h-0 z-20 custom-scrollbar mt-4 xl:mt-0"
      >
        {/* FFT Monitor & Crossovers */}
        <div className="min-h-[280px] bg-surface-container-high/40 backdrop-blur-2xl rounded-3xl border border-white/10 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="p-6 pb-2 flex items-center justify-between z-10">
            <h4 className="font-headline text-[10px] text-primary tracking-[0.3em] font-black uppercase">Spectral_Analyser // Crossover</h4>
            <div className="flex items-center gap-4">
               {/* Master Limiter Brickwall LED */}
               <div className="flex items-center gap-2">
                 <span className="font-headline text-[7px] text-error tracking-[0.2em] font-black uppercase">BRICKWALL</span>
                 <div className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                   masterLimiterActive ? 'bg-error shadow-[0_0_15px_#f87171] border border-error max-scale-125' : 'bg-black/50 border border-white/10'
                 }`} />
               </div>
               
               {/* Master Output VU Meter */}
               <div className="flex flex-col items-end gap-1">
                 <VUMeter analyser={audioEngine.getMasterAnalyser()} orientation="horizontal" className="w-24 h-2 opacity-100" />
                 <span className="font-mono text-[7px] text-outline/50 uppercase">MASTER_PEAK</span>
               </div>
            </div>
          </div>

          <div className="px-6 flex-1 flex flex-col relative z-10">
            <canvas 
              ref={mixerCanvasRef} 
              className="flex-1 w-full bg-black/40 rounded-xl border border-white/5 mb-4"
              role="img"
              aria-label="Real-time spectral analyzer monitor"
            />
            {/* CROSSOVER GATES CONTROLS */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mb-4">
               {[
                 { id: 'low200', label: 'LOW_200Hz', color: 'text-error', border: 'border-error/50', bg: 'bg-error', active: crossoverGates.low200 },
                 { id: 'mid1000', label: 'MID_1kHz', color: 'text-tertiary', border: 'border-tertiary/50', bg: 'bg-tertiary', active: crossoverGates.mid1000 },
                 { id: 'high3000', label: 'HI_3kHz', color: 'text-primary', border: 'border-primary/50', bg: 'bg-primary', active: crossoverGates.high3000 }
               ].map(gate => (
                 <button 
                   key={gate.id}
                   onClick={() => toggleCrossoverGate(gate.id as keyof CrossoverState)}
                   className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                     gate.active ? `bg-surface-container-highest ${gate.border}` : 'border-white/5 opacity-50 hover:bg-surface-container-highest hover:opacity-100'
                   }`}
                 >
                   <div className="font-headline text-[7px] tracking-[0.2em] text-outline font-black mb-2 uppercase">{gate.label}</div>
                   <div className={`w-8 h-2 rounded-full overflow-hidden bg-black/50 border border-white/10 relative`}>
                     <div className={`absolute top-0 bottom-0 left-0 transition-all ${gate.bg} ${gate.active ? 'w-full' : 'w-0'}`} />
                   </div>
                   <span className={`mt-2 font-mono text-[8px] font-bold ${gate.active ? gate.color : 'text-outline/40'}`}>
                     {gate.active ? 'ENGAGED' : 'BYPASS'}
                   </span>
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <div className="flex-1 bg-surface-container-high/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-headline text-[10px] text-outline tracking-[0.3em] font-black uppercase">Transcription_Bus</h4>
             <button 
                onClick={onTranscribe}
                className={`px-4 py-1.5 rounded-full font-headline text-[9px] font-black uppercase transition-all flex items-center gap-2 ${
                  isTranscribing ? 'bg-error text-on-error animate-pulse border border-error/50' : 'bg-surface-container-highest text-outline border border-white/10 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isTranscribing ? 'bg-white' : 'bg-outline'}`} />
                {isTranscribing ? 'Listening...' : 'Transcribe'}
              </button>
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

const PulseView = ({ 
  state, 
  activeSteps,
  onUpdateTrack, 
  onBpmChange, 
  onTogglePlay,
  onUpdateSequencer,
  channels
}: { 
  state: SequencerState, 
  activeSteps: {[key: string]: number},
  onUpdateTrack: (trackId: string, updates: Partial<PulseTrack>) => void, 
  onBpmChange: (bpm: number) => void, 
  onTogglePlay: () => void,
  onUpdateSequencer: (updates: Partial<SequencerState>) => void,
  channels: ChannelState[]
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.02)_0%,transparent_70%)]">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header & Transport */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-primary/20 pb-6">
           <div>
             <h2 className="font-headline text-3xl md:text-5xl text-primary font-black tracking-tighter uppercase italic glow-text leading-none">PULSE_SEQ_v3</h2>
             <span className="font-headline text-[10px] text-outline tracking-[0.4em] uppercase font-bold">Multi-Resolution Quantization Matrix</span>
           </div>
           
           <div className="flex bg-black/50 border border-white/10 rounded-xl p-2 gap-2 shadow-2xl backdrop-blur-md">
              <button 
                onClick={onTogglePlay} 
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-headline font-black tracking-widest text-[10px] uppercase transition-all ${
                  state.isPlaying ? 'bg-error text-on-error shadow-[0_0_15px_#f87171] animate-pulse' : 'bg-surface-container-high text-white hover:bg-white hover:text-black'
                }`}
              >
                {state.isPlaying ? 'HALT_SEQ' : 'INITIATE'}
              </button>
              
              <div className="flex flex-col justify-center px-4 border-l border-white/10 w-32">
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-headline text-[8px] text-outline tracking-widest uppercase">SYS_CLOCK</span>
                   <span className="font-mono text-[10px] text-primary">{state.bpm} BPM</span>
                 </div>
                 <input 
                   type="range" min="60" max="240" value={state.bpm} onChange={e => onBpmChange(parseInt(e.target.value))}
                   className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary cursor-pointer"
                 />
              </div>

              {/* Tempo Drift Control */}
              <div className="flex flex-col justify-center px-4 border-l border-white/10 w-48">
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-headline text-[8px] text-outline tracking-widest uppercase">TEMPO_DRIFT</span>
                   <button 
                     onClick={() => onUpdateSequencer({ tempoDriftEnabled: !state.tempoDriftEnabled })}
                     className={`w-6 h-3 rounded-full relative transition-all ${state.tempoDriftEnabled ? 'bg-primary' : 'bg-white/10'}`}
                   >
                     <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${state.tempoDriftEnabled ? 'right-0.5' : 'left-0.5'}`} />
                   </button>
                 </div>
                 <select 
                   value={state.masterTempoSourceId || ''}
                   onChange={e => onUpdateSequencer({ masterTempoSourceId: e.target.value })}
                   className="bg-transparent border-none text-[8px] text-outline uppercase font-mono outline-none"
                 >
                   <option value="">FOLLOW_INTERNAL</option>
                   {channels.map(ch => (
                     <option key={ch.id} value={ch.id}>FOLLOW: {ch.name}</option>
                   ))}
                 </select>
              </div>
           </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-4">
           {state.tracks.map((track) => (
             <div key={track.id} className="bg-surface-container-highest/30 p-4 border border-white/5 rounded-2xl shadow-xl relative overflow-hidden backdrop-blur-sm flex flex-col gap-4">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] opacity-20 pointer-events-none" />
                
                {/* Track Header */}
                <div className="flex justify-between items-center z-10">
                   <h3 className="font-headline font-black text-white px-2 tracking-[0.2em]">{track.name}</h3>
                   <div className="flex items-center gap-2">
                      <select 
                        value={track.division}
                        onChange={(e) => onUpdateTrack(track.id, { division: parseInt(e.target.value) })}
                        className="bg-black/50 border border-white/10 text-white font-mono text-[10px] rounded p-1 outline-none focus:border-primary/50"
                      >
                         <option value="4">1/4</option>
                         <option value="8">1/8</option>
                         <option value="16">1/16</option>
                         <option value="32">1/32</option>
                         <option value="64">1/64</option>
                         <option value="128">1/128</option>
                      </select>
                      <select 
                        value={track.length}
                        onChange={(e) => {
                          const len = parseInt(e.target.value);
                          const newSteps = [...track.steps];
                          if (newSteps.length < len) {
                             newSteps.push(...Array(len - newSteps.length).fill(false));
                          } else {
                             newSteps.length = len;
                          }
                          onUpdateTrack(track.id, { length: len, steps: newSteps });
                        }}
                        className="bg-black/50 border border-white/10 text-white font-mono text-[10px] rounded p-1 outline-none focus:border-primary/50"
                      >
                         <option value="4">4 Steps</option>
                         <option value="8">8 Steps</option>
                         <option value="16">16 Steps</option>
                         <option value="32">32 Steps</option>
                         <option value="64">64 Steps</option>
                         <option value="128">128 Steps</option>
                      </select>
                   </div>
                </div>

                {/* Track Steps Grid */}
                <div className={`grid gap-2 relative z-10`} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(32px, 1fr))` }}>
                  {track.steps.map((active, i) => {
                    const isPlayhead = activeSteps[track.id] === i;
                    const isDownbeat = i % (track.length >= 16 ? 4 : 2) === 0;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const s = [...track.steps];
                          s[i] = !s[i];
                          onUpdateTrack(track.id, { steps: s });
                        }}
                        className={`group relative aspect-[1/1] sm:aspect-[2/3] flex flex-col items-center justify-end pb-2 rounded-md transition-all border outline-none ${
                          active ? 'border-primary/50 shadow-[0px_0px_10px_rgba(56,189,248,0.3)] bg-gradient-to-t from-primary/30 to-black/40' : 'border-white/5 bg-black/60 hover:border-white/20'
                        } ${isPlayhead ? 'border-white bg-white/10' : ''}`}
                      >
                        {/* Step Number Top */}
                        <span className={`absolute top-1 font-headline text-[6px] tracking-widest uppercase ${active ? 'text-primary' : 'text-outline/30'} ${isDownbeat ? 'font-black' : ''}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>

                        {/* Center Reticle (Active indication) */}
                        <div className={`w-2 h-2 rounded-sm rotate-45 border transition-all my-auto ${
                          active ? 'bg-primary border-primary shadow-[0_0_10px_#38bdf8] scale-110' : 'border-white/10 bg-transparent'
                        } ${isPlayhead ? 'bg-white border-white scale-150' : ''}`} />

                        {/* Bottom Indicator */}
                        <div className={`w-1/2 h-[2px] mt-1 transition-all ${
                          active ? 'bg-primary' : 'bg-white/5'
                        } ${isDownbeat ? 'w-full' : ''}`} />
                      </button>
                    );
                  })}
                </div>
             </div>
           ))}
        </div>

        {/* Info Footer */}
        <div className="flex justify-between items-center font-headline text-[8px] text-outline/50 tracking-[0.3em] border-t border-white/5 pt-4">
           <span>MULTI_TIER_ROUTING // ENABLED</span>
           <span>MASTER_SYNC // QUARTZ</span>
        </div>
      </div>
    </div>
  );
};

const MatrixCanvas = ({ 
  sources, 
  destinations, 
  connections, 
  onToggle 
}: { 
  sources: RoutingSource[], 
  destinations: RoutingDestination[], 
  connections: RoutingConnection[],
  onToggle: (sId: string, dId: string) => void
}) => {
  return (
    <div className="flex-1 w-full bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col p-4 md:p-8">
      {/* Grid Headers - Top (Destinations) */}
      <div className="flex mb-4">
        <div className="w-24 md:w-32 flex-shrink-0" /> {/* Corner Spacer */}
        <div className="flex-1 flex justify-around">
          {destinations.map(dst => (
            <div key={dst.id} className="flex-1 flex flex-col items-center group">
              <span className="font-headline text-[7px] md:text-[9px] text-outline/50 tracking-[0.2em] uppercase origin-bottom -rotate-45 mb-2 group-hover:text-primary transition-colors">{dst.name}</span>
              <div className="w-px h-12 bg-white/5 group-hover:bg-primary/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 flex">
        {/* Row Headers (Sources) */}
        <div className="w-24 md:w-32 flex flex-col justify-around py-2">
          {sources.map(src => (
            <div key={src.id} className="flex items-center gap-2 group h-12">
               <div className={`w-1 h-3 rounded-full ${src.active ? 'bg-primary' : 'bg-outline/20'}`} />
               <span className="font-headline text-[7px] md:text-[9px] text-outline font-black tracking-widest uppercase transition-colors group-hover:text-tertiary truncate">{src.name}</span>
            </div>
          ))}
        </div>

        {/* The Actual Matrix */}
        <div className="flex-1 flex flex-col justify-around relative bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-2 md:p-4">
           {/* Animated Background Flow */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
              <motion.div 
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-full h-full bg-[radial-gradient(circle,rgba(56,189,248,0.2)_1px,transparent_1px)] [background-size:24px_24px]"
              />
           </div>

           {sources.map(src => (
             <div key={src.id} className="flex-1 flex items-center justify-around group h-12 border-b border-white/[0.02]">
                {destinations.map(dst => {
                  const isConnected = connections.some(c => c.sourceId === src.id && c.destinationId === dst.id);
                  return (
                    <button
                      key={`${src.id}-${dst.id}`}
                      onClick={() => onToggle(src.id, dst.id)}
                      className={`w-4 h-4 md:w-6 md:h-6 rounded flex items-center justify-center transition-all relative group/node ${
                        isConnected 
                          ? 'bg-primary shadow-[0_0_15px_#38bdf8] scale-110' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      aria-label={`Route ${src.name} to ${dst.name}`}
                      aria-pressed={isConnected}
                    >
                      {/* Connection Lines (Simulated with nodes) */}
                      {isConnected && (
                        <>
                          <motion.div 
                            layoutId={`signal-${src.id}-${dst.id}`}
                            className="absolute inset-0 bg-primary blur-sm rounded animate-pulse" 
                          />
                          <div className="w-1.5 h-1.5 bg-white rounded-full z-10" />
                        </>
                      )}
                      
                      {!isConnected && <div className="w-1 h-1 bg-white/10 rounded-full group-hover/node:bg-white/30 transition-colors" />}
                    </button>
                  );
                })}
             </div>
           ))}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-4">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-headline text-[8px] text-outline tracking-widest uppercase">CONNECTION_ESTABLISHED</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/5" />
            <span className="font-headline text-[8px] text-outline/40 tracking-widest uppercase">NODE_AVAILABLE</span>
         </div>
         <div className="ml-auto flex items-center gap-2">
            <Zap className="w-3 h-3 text-tertiary" />
            <span className="font-headline text-[8px] text-tertiary tracking-[0.3em] font-black uppercase italic">SIGNAL_OPTIMIZED</span>
         </div>
      </div>
    </div>
  );
};

const MatrixView = ({
  mappings
}: {
  mappings: MatrixMapping[]
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-end border-b border-primary/20 pb-4">
           <div>
             <h2 className="font-headline text-3xl md:text-4xl text-primary font-black tracking-tighter uppercase leading-none italic glow-text">MATRIX_MAPPER_v3</h2>
             <p className="font-headline text-[10px] text-outline tracking-widest uppercase mt-2">Physical interface signal routing / MIDI CC Assignment</p>
           </div>
           <div className="flex gap-2">
              <span className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-xl font-headline text-[9px] tracking-[0.2em] font-black uppercase shadow-[0_0_15px_rgba(56,189,248,0.2)]">MIDI_BRIDGE_ACTIVE</span>
           </div>
        </div>

        {/* Matrix Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Crossover Gates */}
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-outline rotate-45" />
                 <h3 className="font-headline text-xs text-white uppercase tracking-[0.3em] font-black">Crossover_Gates</h3>
              </div>
              <div className="flex flex-col gap-3">
                 {mappings.filter(m => m.target.startsWith('GATE')).map(m => (
                   <div key={m.id} className="bg-surface-container-high/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md group hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full border-2 border-outline/20 relative flex items-center justify-center">
                            <div className="absolute top-1.5 w-1 h-3.5 bg-primary rounded-full origin-bottom rotate-[-120deg]" />
                         </div>
                         <div>
                            <div className="font-headline text-sm text-white font-black uppercase leading-none tracking-tight">{m.target.replace('GATE_', '').replace('_', ' ')}</div>
                            <div className="font-mono text-[9px] text-outline mt-1">CC_WAITING...</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="font-headline text-[8px] tracking-[0.2em] text-outline uppercase mb-1">Midi_CC</div>
                         <div className="bg-black border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-primary font-bold shadow-inner">
                            {m.midiCC !== null ? String(m.midiCC).padStart(3, '0') : '---'}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* WebGL Shader Uniforms */}
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-tertiary rotate-45 shadow-[0_0_10px_#56e5a9]" />
                 <h3 className="font-headline text-xs text-white uppercase tracking-[0.3em] font-black">Shader_Uniforms</h3>
              </div>
              <div className="flex flex-col gap-3">
                 {mappings.filter(m => m.target.startsWith('SHADER')).map(m => (
                   <div key={m.id} className="bg-surface-container-high/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md group hover:border-tertiary/40 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full border-2 border-outline/20 relative flex items-center justify-center">
                            <div className="absolute top-1.5 w-1 h-3.5 bg-tertiary rounded-full origin-bottom rotate-[45deg]" />
                         </div>
                         <div>
                            <div className="font-headline text-sm text-white font-black uppercase leading-none tracking-tight">{m.target.replace('SHADER_', '').replace('_', ' ')}</div>
                            <div className="font-mono text-[9px] text-outline mt-1">VAL: {m.value.toFixed(2)}</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="font-headline text-[8px] tracking-[0.2em] text-outline uppercase mb-1">Midi_CC</div>
                         <div className="bg-black border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-tertiary font-bold shadow-inner">
                            {m.midiCC !== null ? String(m.midiCC).padStart(3, '0') : '---'}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

        </div>

        {/* Global Action */}
        <div className="mt-8 flex justify-center">
           <button className="bg-transparent border-2 border-white/10 hover:border-white/40 text-outline hover:text-white px-8 py-4 rounded-2xl font-headline text-[10px] uppercase tracking-[0.3em] font-black transition-all active:scale-95">
             RESCAN_MIDI_INTERFACES
           </button>
        </div>
      </div>
    </div>
  );
};

const RegistryView = ({ presets, onLoadPreset }: { presets: RegistryPreset[], onLoadPreset: (id: string) => void }) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(presets[0]?.id || null);

  const activePreset = presets.find(p => p.id === selectedPreset);

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0 bg-surface">
      <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-6 md:mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center sticky top-0 bg-surface/80 backdrop-blur-xl z-20 pb-4">
           <div className="flex-1 w-full bg-surface-container-low rounded-xl border border-white/5 flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all group max-w-xl">
             <Settings className="w-5 h-5 text-outline mr-3 group-hover:text-primary transition-colors" aria-hidden="true" />
             <input 
              type="text" 
              placeholder="QUERY_REGISTRY_DATABASE..." 
              aria-label="Search available synth patches and presets"
              className="bg-transparent border-none outline-none text-white font-headline text-sm w-full placeholder:text-outline/30" 
             />
           </div>
           <div className="flex flex-wrap gap-2">
             {['ALL', 'AGGR', 'SYNC', 'VOID', 'LO', 'HI'].map(tag => (
               <button key={tag} className={`px-4 py-1.5 rounded-full font-headline text-[9px] md:text-[10px] tracking-widest uppercase border transition-all active:scale-95 ${
                 tag === 'ALL' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-surface-container-high border-white/5 text-outline hover:text-white hover:border-primary/20'
               }`}>
                 {tag}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
          {presets.map(p => {
            const isActive = selectedPreset === p.id;
            return (
              <button 
                key={p.id} 
                onClick={() => setSelectedPreset(p.id)}
                aria-label={`Preset: ${p.name}. ${isActive ? 'Current selection' : 'Click to select'}`}
                className={`p-5 md:p-6 rounded-3xl transition-all duration-300 relative overflow-hidden group text-left focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  isActive ? 'bg-surface-container-high border-l-4 border-primary shadow-2xl scale-[1.02]' : 'bg-surface-container-low border border-white/5 hover:bg-surface-container-high hover:scale-[1.01]'
                }`}
              >
                <div className="flex justify-between items-start mb-4 md:mb-6">
                   <div>
                     <h3 className={`font-headline text-base md:text-lg font-black mb-1 leading-none ${isActive ? 'text-primary glow-text' : 'text-white group-hover:text-primary transition-colors'}`}>{p.name}</h3>
                     <p className="text-[9px] text-outline font-headline uppercase tracking-tighter">ID: {p.id} // TS: {p.lastModified}</p>
                   </div>
                   {isActive && <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]" aria-hidden="true" />}
                </div>
                
                <div className="flex flex-wrap gap-2 font-headline text-[8px] text-outline tracking-[0.2em] uppercase mt-4">
                  {p.tags.map(t => <span key={t} className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{t}</span>)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="w-full xl:w-[400px] bg-surface-container-low border-l border-white/10 p-6 md:p-8 flex flex-col shadow-2xl xl:static fixed inset-y-0 right-0 z-40 translate-x-full xl:translate-x-0 transition-transform">
         <div className="mb-2">
            <span className="font-headline text-[10px] text-primary tracking-[0.3em] font-black uppercase">REGISTRY_INSPECTOR</span>
         </div>
         {activePreset ? (
           <>
             <h2 className="font-headline text-2xl md:text-3xl text-white font-black tracking-tighter glow-text mb-4 uppercase">{activePreset.name}</h2>
             <p className="font-body text-sm text-outline mb-8 leading-relaxed font-light">{activePreset.description}</p>
             
             <div className="flex bg-black/40 border border-white/5 p-4 rounded-xl flex-col gap-2 mb-10 overflow-hidden">
                <span className="font-headline text-[8px] text-outline/50 uppercase tracking-[0.3em]">JSON_PATCH_DATA</span>
                <pre className="font-mono text-[10px] text-tertiary overflow-hidden text-ellipsis">
                  {JSON.stringify(JSON.parse(activePreset.patchData), null, 2)}
                </pre>
             </div>

             <button 
               onClick={() => onLoadPreset(activePreset.id)}
               className="mt-auto bg-primary hover:bg-white text-on-primary-container py-4 md:py-5 rounded-2xl font-headline font-black text-xs tracking-widest shadow-2xl active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-3"
             >
                <Plus className="w-4 h-4" />
                ADD_TO_SESSION
             </button>
           </>
         ) : (
           <div className="flex-1 flex items-center justify-center font-headline text-xs text-outline/50 uppercase tracking-[0.3em]">
              NO_PRESET_SELECTED
           </div>
         )}
      </aside>
    </div>
  );
};

const ProjectorView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const tryConnect = () => {
      try {
        // @ts-ignore
        const mainStream = window.opener?.window?.extreamixMainStream;
        if (mainStream && videoRef.current) {
          if (videoRef.current.srcObject !== mainStream) {
            videoRef.current.srcObject = mainStream;
            videoRef.current.play().catch(console.error);
          }
        }
      } catch (e) {
        console.warn("Unable to connect to mainline hub stream.", e);
      }
      setTimeout(tryConnect, 1000);
    };
    
    tryConnect();
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-contain" autoPlay muted playsInline />
      <div className="absolute top-4 left-4 font-headline text-[8px] text-primary/30 uppercase tracking-[0.4em]">EXTREAMIX_REMOTE_NODE</div>
    </div>
  );
};

// --- Main App Implementation ---

export default function App() {
  const isProjector = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('projector') === 'true';
  const [isLaunched, setIsLaunched] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extreamix_isLaunched') === 'true';
    }
    return false;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('mixer');
  
  const [channels, setChannels] = useState<ChannelState[]>(() => {
    const defaultFX: FXState = {
      delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { active: false, roomSize: 0.5, mix: 0.3 },
      chorus: { active: false, rate: 0.2, depth: 0.3, mix: 0.2 },
      phaser: { active: false, rate: 0.1, depth: 0.5, mix: 0.2 }
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_channels');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: Ensure new fields exist
        return parsed.map((ch: any) => ({
          ...ch,
          fx: ch.fx || defaultFX,
          pitchCorrection: ch.pitchCorrection || 0,
          beatCorrection: ch.beatCorrection || 0
        }));
      }
    }
    return [
      { id: 'v-synth', name: 'V-Synth', volume: 0.7, pan: 0, depth: 0, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: defaultFX, pitchCorrection: 0, beatCorrection: 0 },
      { id: 'drum-machine', name: 'Drum Mach', volume: 0.8, pan: 0.2, depth: 0.1, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: defaultFX, pitchCorrection: 0, beatCorrection: 0 },
      { id: 'ch-3', name: 'Arp Bass', volume: 0.5, pan: -0.3, depth: 0.5, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: defaultFX, pitchCorrection: 0, beatCorrection: 0 },
      { id: 'ch-4', name: 'Vocal Vox', volume: 0.6, pan: 0, depth: -0.2, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: defaultFX, pitchCorrection: 0, beatCorrection: 0 },
    ];
  });
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

  const [sequencer, setSequencer] = useState<SequencerState>(() => {
    const defaultMasterFX: FXState = {
      delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { active: false, roomSize: 0.5, mix: 0.3 },
      chorus: { active: false, rate: 0.2, depth: 0.3, mix: 0.2 },
      phaser: { active: false, rate: 0.1, depth: 0.5, mix: 0.2 }
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_sequencer');
      if (saved) {
         try {
           const parsed = JSON.parse(saved);
           if (parsed.tracks) return {
             ...parsed,
             tempoDriftEnabled: parsed.tempoDriftEnabled || false,
             masterVolume: parsed.masterVolume || 0.9,
             masterFX: parsed.masterFX || defaultMasterFX
           };
         } catch(e) {}
      }
    }
    return {
      tracks: [
        { id: 'trk-1', name: 'ALPHA_PULSE', division: 16, length: 16, steps: [true, false, false, true, false, false, true, false, true, true, false, false, false, true, false, true] },
        { id: 'trk-2', name: 'BETA_KICK', division: 4, length: 4, steps: [true, true, true, true] },
        { id: 'trk-3', name: 'GAMMA_SUB', division: 8, length: 8, steps: [false, true, false, true, false, false, true, false] }
      ],
      bpm: 120,
      isPlaying: false,
      masterTick: 0,
      tempoDriftEnabled: false,
      tempoDriftThreshold: 40,
      masterVolume: 0.9,
      masterFX: defaultMasterFX
    };
  });
  
  // High-resolution clock tick to drive UI playheads
  const [pulseActiveSteps, setPulseActiveSteps] = useState<{[key: string]: number}>({});
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [routingSources, setRoutingSources] = useState<RoutingSource[]>([
    { id: 'src-1', name: 'TAB_AUDIO_LOFI', active: true, type: 'tab' },
    { id: 'src-2', name: 'MIC_INPUT_PRIMARY', active: true, type: 'mic' },
    { id: 'src-3', name: 'OSC_GENERATOR_A', active: true, type: 'generator' },
  ]);

  const [routingDestinations] = useState<RoutingDestination[]>([
    { id: 'dst-1', name: 'CONSOLE_CH_1' },
    { id: 'dst-2', name: 'CONSOLE_CH_2' },
    { id: 'dst-3', name: 'CONSOLE_CH_3' },
    { id: 'dst-4', name: 'CONSOLE_CH_4' },
    { id: 'dst-5', name: 'MASTER_OUT' },
  ]);

  const [routingConnections, setRoutingConnections] = useState<RoutingConnection[]>([
    { sourceId: 'src-1', destinationId: 'dst-1' },
    { sourceId: 'src-2', destinationId: 'dst-4' },
    { sourceId: 'src-3', destinationId: 'dst-3' },
  ]);

  // --- EXTREAMIX Overhaul States ---
  const [crossoverGates, setCrossoverGates] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_crossoverGates');
      if (saved) return JSON.parse(saved);
    }
    return {
      low200: true,
      mid1000: false,
      high3000: true
    };
  });

  const [shaderUniforms, setShaderUniforms] = useState({
    rgbSplit: 0.5,
    pixelation: 0.1
  });

  const [matrixMappings, setMatrixMappings] = useState<MatrixMapping[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_matrixMappings');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 'm1', target: 'GATE_LOW_200', midiCC: 14, value: 1 },
      { id: 'm2', target: 'GATE_MID_1000', midiCC: 15, value: 0 },
      { id: 'm3', target: 'GATE_HIGH_3000', midiCC: 16, value: 1 },
      { id: 'm4', target: 'SHADER_RGB_SPLIT', midiCC: 74, value: 0.5 },
      { id: 'm5', target: 'SHADER_PIXELATION', midiCC: 75, value: 0.1 }
    ];
  });

  const [registryPresets, setRegistryPresets] = useState([
    { id: 'p1', name: 'HYPER_DRIVE_01', description: 'Aggressive compression and extreme RGB splitting.', tags: ['AGGR', 'SYNC'], lastModified: '2026-04-18', patchData: '{"hue": "shift"}' },
    { id: 'p2', name: 'VOID_AMBIENCE', description: 'Submersive low-pass routing with heavy pixelation.', tags: ['VOID', 'LO'], lastModified: '2026-04-17', patchData: '{"pixel": "max"}' },
  ]);

  // Master Limiter state for LED feedback in Console
  const [masterLimiterActive, setMasterLimiterActive] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extreamix_isLaunched', isLaunched.toString());
    }
  }, [isLaunched]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extreamix_channels', JSON.stringify(channels));
    }
  }, [channels]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extreamix_sequencer', JSON.stringify(sequencer));
    }
  }, [sequencer]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extreamix_crossoverGates', JSON.stringify(crossoverGates));
    }
  }, [crossoverGates]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extreamix_matrixMappings', JSON.stringify(matrixMappings));
    }
  }, [matrixMappings]);

  // Master Engine Sync
  useEffect(() => {
    audioEngine.setMasterVolume(sequencer.masterVolume);
    audioEngine.setTempoDriftThreshold(sequencer.tempoDriftThreshold);
    audioEngine.updateMasterFX(sequencer.masterFX);
    audioEngine.updateCrossover(crossoverGates);
  }, [sequencer.masterVolume, sequencer.tempoDriftThreshold, sequencer.masterFX, crossoverGates]);


  useEffect(() => {
    audioEngine.init();
    channels.forEach(ch => audioEngine.createChannel(ch.id, ch));
  }, []);

  const toggleCrossoverGate = (gate: keyof typeof crossoverGates) => {
    setCrossoverGates(prev => ({ ...prev, [gate]: !prev[gate] }));
  };

  const loadPreset = (presetId: string) => {
    console.log(`[EXTREAMIX_LOADER] Injecting JSON patch for session: ${presetId}`);
    // Simulate loading a preset by briefly triggering the limiter LED and logging
    setMasterLimiterActive(true);
    setTimeout(() => setMasterLimiterActive(false), 300);
  };

  const handleRouteExternalTab = async () => {
    try {
      let captureConfig: any = {
        video: true,
        audio: {
          suppressLocalAudioPlayback: true,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        surfaceSwitching: "exclude",
        selfBrowserSurface: "exclude",
        monitorTypeSurfaces: "exclude",
        preferCurrentTab: false
      };
      
      // @ts-ignore
      let controller;
      // @ts-ignore
      if (window.CaptureController) {
        // @ts-ignore
        controller = new CaptureController();
        controller.setFocusBehavior("no-focus-change");
        captureConfig.controller = controller;
      }

      // @ts-ignore - getDisplayMedia might not be in the type definitions for all environments
      const stream = await navigator.mediaDevices.getDisplayMedia(captureConfig);
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.stop(); // We only want audio
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioEngine.routeStreamToChannel(stream, 'ch-1');
        // Update transcription to show something happened
        setChannels(prev => prev.map(ch => ch.id === 'ch-1' ? { ...ch, name: 'EXTERNAL AUDIO' } : ch));
      }
    } catch (err) {
      console.error('Routing failed:', err);
    }
  };

  const handlePlay = () => {
    if (sequencer.isPlaying) {
      audioEngine.stopSequencer();
      setSequencer(prev => ({ ...prev, isPlaying: false }));
      setPulseActiveSteps({});
    } else {
      audioEngine.startSequencer(
        sequencer.bpm, 
        sequencer.tracks, 
        sequencer.tempoDriftEnabled, 
        sequencer.masterTempoSourceId
      );
      setSequencer(prev => ({ ...prev, isPlaying: true }));
    }
  };

  useEffect(() => {
    audioEngine.onStep = (trackId, step, isActive) => {
      setPulseActiveSteps(prev => ({ ...prev, [trackId]: step }));
      
      if (!isActive) return;

      // Update visual engine & state for latches
      let needsStateUpdate = false;
      videoEngine.getSources().forEach(source => {
        if (source.pulseRouting && source.pulseRouting.includes(trackId)) {
          source.pulseOpacity = 1;
          needsStateUpdate = true;
        }
      });
      if (needsStateUpdate) {
        setVideoSources(videoEngine.getSources());
      }
    };

    audioEngine.onBpmChange = (bpm) => {
      setSequencer(prev => {
        // Only update if it actually changed to prevent render loops
        if (prev.bpm === bpm) return prev;
        return { ...prev, bpm };
      });
    };

    audioEngine.onLimiterActive = (active) => {
      setMasterLimiterActive(active);
    };

    return () => {
      audioEngine.onStep = () => {};
      audioEngine.onBpmChange = undefined;
      audioEngine.onLimiterActive = undefined;
    };
  }, []);
  
  // Animation loop to decay visual pulse Opacity
  useEffect(() => {
    let animId: number;
    const decay = () => {
      let changed = false;
      videoEngine.getSources().forEach(source => {
        if (source.pulseOpacity > 0) {
          // Sharp decay to produce "filtered" strobe effect
          source.pulseOpacity = Math.max(0, source.pulseOpacity - 0.2); 
          changed = true;
        }
      });
      if (changed) {
        setVideoSources(videoEngine.getSources());
      }
      animId = requestAnimationFrame(decay);
    };
    decay();
    return () => cancelAnimationFrame(animId);
  }, []);

  const [activeVideoSourceId, setActiveVideoSourceId] = useState<string | null>(null);

  useEffect(() => {
    videoEngine.onUpdateSource = (id, update) => {
       setVideoSources(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
    };
    videoEngine.onSelectSource = (id) => {
       setActiveVideoSourceId(id);
       // Only switch view if we're not already in a view that handles imaging
       // This prevents jarring jumps if the user is interacting with the canvas
    };
    return () => {
      videoEngine.onUpdateSource = undefined;
      videoEngine.onSelectSource = undefined;
    };
  }, []);

  const handleAddVideoSource = async () => {
    try {
      let captureConfig: any = {
        video: {
          displaySurface: "browser", // Prefer browser tabs for better control
        },
        audio: {
          suppressLocalAudioPlayback: true,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        surfaceSwitching: "exclude",
        selfBrowserSurface: "exclude",
        monitorTypeSurfaces: "exclude",
        preferCurrentTab: false
      };
      
      // @ts-ignore
      let controller;
      // @ts-ignore
      if (window.CaptureController) {
        // @ts-ignore
        controller = new CaptureController();
        // Force the browser to stay focused on the current app tab
        controller.setFocusBehavior("no-focus-change");
        captureConfig.controller = controller;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(captureConfig);
      
      // Secondary focus fallback - though browsers often throttle this, 
      // calling it immediately after a success is most likely to succeed.
      window.focus();
      
      const source = videoEngine.addSource(stream, `Visual Source ${videoSources.length + 1}`);
      
      const hasAudio = stream.getAudioTracks().length > 0;
      if (hasAudio) {
        const newChannelId = `ch-vid-${Date.now()}`;
        const newChannel: ChannelState = {
          id: newChannelId,
          name: `Feed ${videoSources.length + 1}`,
          volume: 0.7,
          pan: 0,
          depth: 0,
          mute: true, // DEFAULT MUTE TO PREVENT FEEDBACK
          solo: false,
          eq: { low: 0, mid: 0, high: 0 },
          fx: {
            delay: { active: false, time: 0.3, feedback: 0.4, mix: 0.3 },
            reverb: { active: false, roomSize: 0.5, mix: 0.3 },
            chorus: { active: false, rate: 0.2, depth: 0.3, mix: 0.2 },
            phaser: { active: false, rate: 0.1, depth: 0.5, mix: 0.2 }
          },
          pitchCorrection: 0,
          beatCorrection: 0
        };
        setChannels(prev => [...prev, newChannel]);
        audioEngine.createChannel(newChannelId, newChannel);
        source.audioChannelId = newChannelId;
        audioEngine.routeStreamToChannel(stream, newChannelId, source.id);
      }
      
      setVideoSources(prev => [...prev, source]);
      // Focus on the new source
      setActiveVideoSourceId(source.id);
    } catch (err) {
      console.error('Failed to add video source:', err);
    }
  };

  const updateVideoSource = (id: string, update: Partial<VideoSource>) => {
    const existing = videoSources.find(s => s.id === id);
    if (!existing) return;

    if (update.audioChannelId !== undefined && update.audioChannelId !== existing.audioChannelId) {
      if (update.audioChannelId) {
        audioEngine.routeStreamToChannel(existing.stream, update.audioChannelId, id);
      }
    }

    videoEngine.updateSource(id, update);
    setVideoSources(videoEngine.getSources());
  };

  const toggleRoutingConnection = (sourceId: string, destinationId: string) => {
    setRoutingConnections(prev => {
      const exists = prev.find(c => c.sourceId === sourceId && c.destinationId === destinationId);
      if (exists) {
        return prev.filter(c => !(c.sourceId === sourceId && c.destinationId === destinationId));
      }
      return [...prev, { sourceId, destinationId }];
    });
  };

  const updateChannel = (id: string, update: Partial<ChannelState>) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        const next = { ...ch, ...update };
        audioEngine.updateChannel(id, next);
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

  if (!isLaunched) {
    return <LandingPage onInitiate={() => setIsLaunched(true)} />;
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-surface overflow-hidden">
      {/* Top Bar - Simplified for mobile */}
      <header className="h-14 md:h-16 flex-shrink-0 px-4 md:px-8 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-white/5 z-50">
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

          <div className="h-8 w-[1px] bg-white/10 mx-1 md:mx-2 hidden sm:block" />
          <div className="flex items-center gap-1">
            <IconButton icon={Settings} label="General Settings" className="scale-90 md:scale-100" onClick={() => setIsSettingsOpen(true)} />
            <div className="w-8 h-8 rounded-full border border-primary/30 ml-2 md:ml-4 overflow-hidden relative flex-shrink-0">
               <img src="https://picsum.photos/seed/sonicuser/64/64" alt="User Profile Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* Navigation - Bottom bar on mobile, Sidebar on desktop */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 md:h-auto bg-surface-container-high/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-40 transition-all md:relative md:w-20 lg:w-24 md:flex-col md:border-t-0 md:border-r md:justify-start md:py-8 lg:p-0">
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
            <NavItem icon={Settings} label="Config" active={isSettingsOpen} onClick={() => setIsSettingsOpen(true)} />
          </div>
        </nav>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col p-2 md:p-6 lg:p-8 relative pb-20 md:pb-0 custom-scrollbar min-h-0">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.005] pointer-events-none select-none overflow-hidden">
            <span className="font-headline text-[20rem] md:text-[40rem] font-black pointer-events-none uppercase">{currentView}</span>
          </div>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="absolute top-4 right-4 text-outline hover:text-white"
                  >
                     ✕
                  </button>
                  <h2 className="font-headline text-xl text-primary font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">System configuration</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-headline text-xs text-outline tracking-wider uppercase mb-2">Memory Allocation</h3>
                      <button 
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className="w-full py-3 px-4 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl font-headline text-[10px] tracking-widest uppercase transition-all"
                      >
                         PURGE_LOCAL_CACHE // FACTORY_RESET
                      </button>
                      <p className="mt-2 text-[10px] font-mono text-outline/50 uppercase">Clears all saved channels, sequencer patterns, and routing matrix configs.</p>
                    </div>

                    <div>
                      <h3 className="font-headline text-xs text-outline tracking-wider uppercase mb-2">Session Interface</h3>
                      <button 
                         onClick={() => {
                           localStorage.removeItem('extreamix_isLaunched');
                           window.location.reload();
                         }}
                         className="w-full py-3 px-4 bg-surface-container-high hover:bg-surface-container-highest border border-white/10 text-white rounded-xl font-headline text-[10px] tracking-widest uppercase transition-all"
                      >
                         RETURN_TO_ACQUISITION_TERMINAL
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView === 'vision' ? 'vision' : 'other'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col z-10 min-h-0"
            >
              <div className={currentView === 'vision' ? 'flex-1 flex flex-col' : 'hidden'}>
                <ImagingView 
                  sources={videoSources} 
                  onUpdate={updateVideoSource} 
                  onAdd={handleAddVideoSource} 
                  channels={channels} 
                  activeSourceId={activeVideoSourceId}
                  sequencer={sequencer}
                />
              </div>

              {currentView === 'mixer' && (
                <ConsoleView 
                  channels={channels} 
                  updateChannel={updateChannel} 
                  transcripts={transcripts} 
                  masterLimiterActive={masterLimiterActive}
                  crossoverGates={crossoverGates}
                  toggleCrossoverGate={toggleCrossoverGate}
                  onTranscribe={handleTranscribe}
                  isTranscribing={isTranscribing}
                  sequencer={sequencer}
                  setSequencer={setSequencer}
                />
              )}
              {currentView === 'sequencer' && (
                <PulseView 
                  state={sequencer} 
                  activeSteps={pulseActiveSteps}
                  onUpdateTrack={(trackId, updates) => {
                    setSequencer(prev => ({
                      ...prev,
                      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
                    }))
                  }}
                  onBpmChange={(bpm) => setSequencer(prev => ({ ...prev, bpm }))}
                  onTogglePlay={handlePlay}
                  onUpdateSequencer={(updates) => setSequencer(prev => ({ ...prev, ...updates }))}
                  channels={channels}
                />
              )}
              {currentView === 'routing' && (
                <MatrixView 
                  mappings={matrixMappings} 
                />
              )}
              {currentView === 'library' && (
                <RegistryView 
                  presets={registryPresets}
                  onLoadPreset={loadPreset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer / Preview Strip - Hidden on small mobile */}
      <footer className="h-14 md:h-20 flex-shrink-0 px-4 md:px-8 bg-surface-container-high/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between z-30 hidden sm:flex">
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
              <VUMeter analyser={audioEngine.getMasterAnalyser()} orientation="horizontal" className="w-32 h-2" />
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

