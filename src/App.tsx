/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  RefreshCcw,
  Trash2,
  Volume2,
  Repeat,
  History,
  Timer,
  Mic2,
  ChevronDown,
  Video,
  Camera,
  Layers,
  Zap,
  ExternalLink,
  Maximize2,
  Tv,
  Clock,
  Waves,
  Disc,
  Wind,
  PackagePlus,
  Wand2,
  Shield // Added Shield for Admin
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { View, ChannelState, SequencerState, RoutingSource, VideoSource, RoutingDestination, RoutingConnection, CrossoverState, MatrixMapping, RegistryPreset, PulseTrack, FXState, CustomVideoFilter } from './types';
import { useSubscription } from './hooks/useSubscription';
import { ENTITLEMENTS } from './services/revenueCat';
import { audioEngine } from './services/audioEngine';
import { videoEngine } from './services/videoEngine';
import { midiService } from './services/MidiService';
import { useCaptureRig } from './hooks/useCaptureRig';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AddonsView } from './components/AddonsView';
import { ProfileView } from './components/ProfileView';
import { FilterDesignerView, WebGLPreview } from './components/FilterDesignerView';
import { BroadcastView } from './components/BroadcastView';
import { AdBanner } from './components/AdBanner';

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
  onRemove,
  onAdd, 
  onAddCamera,
  channels,
  activeSourceId,
  sequencer,
  cameraFacingMode,
  setCameraFacingMode,
  customFilters
}: { 
  sources: VideoSource[], 
  onUpdate: (id: string, update: Partial<VideoSource>) => void, 
  onRemove: (id: string) => void,
  onAdd: () => void, 
  onAddCamera: () => void,
  channels: ChannelState[],
  activeSourceId: string | null,
  sequencer: SequencerState,
  cameraFacingMode: 'user' | 'environment',
  setCameraFacingMode: (mode: 'user' | 'environment') => void,
  customFilters: CustomVideoFilter[]
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
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
        const stream = canvasRef.current.captureStream(30);
        window.extreamixMainStream = stream;
        
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = stream;
        }
      } catch(e) {
        console.warn("Could not capture stream from canvas", e);
      }
    }

    const checkScreens = async () => {
      if ('getScreenDetails' in window) {
        try {
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
      videoEngine.stopRender();
    };
  }, []);

  const handleLaunchProjector = async () => {
    try {
      if (document.pictureInPictureEnabled && pipVideoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await pipVideoRef.current.requestPictureInPicture();
        }
      } else {
        alert("Picture-in-Picture is not supported in this browser.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to launch pop-out preview.");
    }
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
    <div className="flex-1 flex flex-col xl:flex-row gap-4 md:gap-6 overflow-y-auto min-h-0 p-2 md:p-4 custom-scrollbar pb-32 xl:pb-4">
      {/* Main Canvas Monitor */}
      <div 
        ref={containerRef}
        className="w-full xl:flex-[3] aspect-video xl:aspect-auto min-h-[250px] md:min-h-[400px] xl:min-h-0 bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden relative group shadow-2xl flex items-center justify-center p-2 md:p-4"
      >
        <video ref={pipVideoRef} autoPlay playsInline muted className="hidden" />
        <canvas 
          ref={canvasRef} 
          id="extreamix-canvas" // Added ID for capture rig
          className="max-w-full max-h-full aspect-video rounded-xl shadow-2xl border border-white/10 bg-black" 
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
           
           <div className="flex bg-white/10 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden p-0.5">
             <button 
               onClick={() => setCameraFacingMode('user')} 
               className={`px-3 py-1.5 md:p-2.5 rounded-lg transition-all flex flex-col items-center gap-0.5 ${cameraFacingMode === 'user' ? 'bg-primary text-on-primary-container' : 'text-white/40 hover:text-white'}`}
               title="Switch to Front (Selfie) Camera"
             >
               <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
               <span className="text-[6px] font-black uppercase">Selfie</span>
             </button>
             <button 
               onClick={() => setCameraFacingMode('environment')} 
               className={`px-3 py-1.5 md:p-2.5 rounded-lg transition-all flex flex-col items-center gap-0.5 ${cameraFacingMode === 'environment' ? 'bg-primary text-on-primary-container' : 'text-white/40 hover:text-white'}`}
               title="Switch to Back Camera"
             >
               <Monitor className="w-3.5 h-3.5 md:w-4 md:h-4" />
               <span className="text-[6px] font-black uppercase">Back</span>
             </button>
             <div className="w-[1px] h-full bg-white/10 mx-0.5" />
             <button onClick={onAddCamera} className="text-white hover:bg-white/10 px-4 md:px-5 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5" title="Add Camera Feed">
               <Plus className="w-4 h-4 md:w-5 md:h-5 text-tertiary" />
               <span className="text-[6px] font-black uppercase text-tertiary">Inject</span>
             </button>
           </div>

           <button onClick={onAdd} className="bg-tertiary hover:bg-white text-on-tertiary-container px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-headline font-black text-[10px] md:text-xs flex items-center gap-2 shadow-[0_20px_50px_rgba(86,229,169,0.3)] active:scale-95 transition-all uppercase tracking-widest">
             <Plus className="w-4 h-4" />
             <span className="hidden sm:inline">INJECT_FEED</span>
             <span className="sm:hidden">ADD</span>
           </button>
        </div>
      </div>

      {/* Control Panel */}
      <aside 
        className="xl:flex-1 bg-surface-container-high/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 md:p-6 flex flex-col gap-6 xl:overflow-y-auto min-h-0 custom-scrollbar shadow-2xl mt-4 xl:mt-0"
      >
        <div className="flex items-center justify-between sticky top-0 bg-surface-container-high/80 backdrop-blur-xl -mx-4 -mt-4 md:-mx-6 md:-mt-6 p-4 md:p-6 border-b border-white/5 z-20">
           <div>
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none italic glow-text">IMAGING_HUB</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Multi-Spectral Blending</span>
           </div>
           <Zap className="w-4 h-4 md:w-5 md:h-5 text-tertiary animate-pulse" />
        </div>

        <div ref={scrollContainerRef} className="space-y-6 xl:flex-1 xl:overflow-y-auto custom-scrollbar pr-1">
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
                      <span className="font-headline text-[9px] md:text-[10px] text-white uppercase">Pop-out PiP</span>
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
              </div>
           </div>

            <Reorder.Group 
              axis="y" 
              values={[...sources].sort((a, b) => b.zIndex - a.zIndex)} 
              onReorder={(newOrder) => {
                 newOrder.forEach((src, idx) => {
                   onUpdate(src.id, { zIndex: newOrder.length - idx });
                 });
              }}
              className="space-y-4 pt-2 pb-10"
            >
            {[...sources].sort((a, b) => b.zIndex - a.zIndex).map(source => {
              const isSelected = activeSourceId === source.id;
              return (
              <Reorder.Item 
                 key={source.id} 
                 value={source}
                 id={`vis-config-${source.id}`}
                 initial={false}
                 animate={isSelected ? { scale: [1, 1.02, 1], borderColor: 'rgba(56,189,248,0.5)' } : { scale: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                 transition={{ duration: 0.5 }}
                 className={`rounded-2xl p-4 border space-y-4 transition-colors group cursor-grab active:cursor-grabbing ${
                   isSelected ? 'bg-primary/10 shadow-[0_0_30px_rgba(56,189,248,0.15)] outline outline-2 outline-primary/20' : 'bg-surface-container-low/50 hover:bg-surface-container-low'
                 }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 pointer-events-none">
                      <Monitor className="w-4 h-4 text-primary" />
                    </div>
                    <div className="pointer-events-none">
                      <span className="font-headline text-[10px] font-bold block truncate max-w-[120px] uppercase text-white">{source.name}</span>
                      <span className="text-[7px] text-outline font-mono uppercase tracking-tighter">Z-Index: {source.zIndex}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                     onClick={() => onUpdate(source.id, { active: !source.active })}
                     className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${source.active ? 'bg-primary text-on-primary-container shadow-[0_0_20px_rgba(142,213,255,0.4)]' : 'bg-surface-container-highest text-outline border border-white/10'}`}
                     title={source.active ? "Deactivate Feed" : "Activate Feed"}
                     onPointerDown={e => e.stopPropagation()}
                    >
                      <Layers className="w-3 h-3" />
                    </button>
                    <button 
                     onClick={() => onRemove(source.id)}
                     className="w-7 h-7 rounded-xl flex items-center justify-center bg-error/10 text-error hover:bg-error hover:text-on-error border border-error/20 transition-all"
                     title="Remove Feed Permanent"
                     onPointerDown={e => e.stopPropagation()}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3" onPointerDown={e => e.stopPropagation()}>
                  <div className="space-y-1">
                    <div className="flex justify-between font-headline text-[8px] text-outline uppercase tracking-wider">
                      <span>Opacity</span>
                      <span className="text-primary">{Math.round(source.opacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={source.opacity}
                      onChange={e => onUpdate(source.id, { opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary touch-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-headline text-[8px] text-outline uppercase tracking-wider">
                      <span>Scale</span>
                      <span className="text-primary">{Math.round(source.scale * 100)}%</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="3" step="0.01" value={source.scale}
                      onChange={e => onUpdate(source.id, { scale: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary touch-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3" onPointerDown={e => e.stopPropagation()}>
                   <div className="space-y-1">
                     <div className="font-headline text-[8px] text-outline uppercase tracking-wider">X Position</div>
                     <input 
                       type="range" min="-1" max="1" step="0.01" value={source.position.x}
                       onChange={e => onUpdate(source.id, { position: { ...source.position, x: parseFloat(e.target.value) } })}
                       className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-tertiary touch-none"
                     />
                   </div>
                   <div className="space-y-1">
                     <div className="font-headline text-[8px] text-outline uppercase tracking-wider">Y Position</div>
                     <input 
                       type="range" min="-1" max="1" step="0.01" value={source.position.y}
                       onChange={e => onUpdate(source.id, { position: { ...source.position, y: parseFloat(e.target.value) } })}
                       className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-tertiary touch-none"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3" onPointerDown={e => e.stopPropagation()}>
                  <div className="space-y-1">
                    <div className="font-headline text-[8px] text-outline uppercase tracking-wider">Blend Mode</div>
                    <select 
                      value={source.blendMode}
                      onChange={e => onUpdate(source.id, { blendMode: e.target.value })}
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-2 py-1 text-[9px] text-white outline-none cursor-pointer hover:border-primary/30 transition-all font-headline font-bold uppercase tracking-wider"
                    >
                      <optgroup label="Standard" className="bg-surface-container">
                       <option value="source-over">Normal</option>
                       <option value="screen">Screen</option>
                       <option value="multiply">Multiply</option>
                       <option value="overlay">Overlay</option>
                      </optgroup>
                      <optgroup label="Spectral / Color" className="bg-surface-container">
                       <option value="additive">Additive</option>
                       <option value="subtractive">Subtract</option>
                       <option value="exclusion">Exclusion</option>
                       <option value="hue">Hue</option>
                       <option value="color">Color</option>
                       <option value="luminosity">Luma</option>
                       <option value="color-dodge">Dodge</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="font-headline text-[8px] text-outline uppercase tracking-wider">AI Filter Preset</div>
                    <select 
                      value={source.customFilterId || ''}
                      onChange={e => onUpdate(source.id, { customFilterId: e.target.value })}
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-2 py-1 text-[9px] text-primary outline-none cursor-pointer hover:border-primary/30 transition-all font-headline font-bold uppercase tracking-wider"
                    >
                      <option value="">None</option>
                      {customFilters.map(f => (
                         <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {source.customFilterId && customFilters.find(f => f.id === source.customFilterId) && source.stream && (
                       <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden border border-primary/30 bg-black relative shadow-[0_0_15px_rgba(56,189,248,0.1)] pointer-events-none">
                         <WebGLPreview 
                           stream={source.stream}
                           fragmentShader={customFilters.find(f => f.id === source.customFilterId)!.shaderCode}
                         />
                         <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[7px] text-primary font-mono uppercase">Filter Preview</div>
                       </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3" onPointerDown={e => e.stopPropagation()}>
                  <div className="space-y-1">
                    <div className="font-headline text-[8px] text-outline uppercase tracking-wider flex justify-between">
                      <span>Pulse Gate</span>
                      {source.pulseRouting && source.pulseRouting.length > 0 && <span className="text-primary animate-pulse font-black text-[7px]">ON</span>}
                    </div>
                    <select 
                      multiple
                      value={source.pulseRouting}
                      onChange={e => onUpdate(source.id, { pulseRouting: Array.from(e.target.selectedOptions, option => option.value) })}
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl px-2 py-1 text-[9px] text-primary outline-none cursor-pointer hover:border-primary/30 transition-all font-headline font-bold uppercase tracking-wider custom-scrollbar"
                      style={{ height: '70px' }}
                    >
                      <optgroup label="Audio Tracks" className="bg-surface-container">
                        {channels.map(c => <option key={c.id} value={`channel-${c.id}`}>{c.name}</option>)}
                      </optgroup>
                      <optgroup label="Sequencer Tracks" className="bg-surface-container">
                        {sequencer.tracks.map(t => <option key={t.id} value={`sequencer-${t.id}`}>{t.name}</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="font-headline text-[8px] text-outline uppercase tracking-wider">Pitch Correct</div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={source.pitchCorrection}
                      onChange={e => onUpdate(source.id, { pitchCorrection: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-surface-container-highest appearance-none rounded-full accent-primary cursor-pointer touch-none"
                    />
                  </div>
                </div>
              </Reorder.Item>
            ))}</Reorder.Group>
         </div>
      </aside>
    </div>
  );
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
  setSequencer,
  // MIDI Learn Props
  learningId,
  setLearningId,
  handleLearnMapping,
}: {
  channels: ChannelState[];
  updateChannel: (id: string, state: Partial<ChannelState>) => void;
  transcripts: string[];
  masterLimiterActive: boolean;
  crossoverGates: CrossoverState;
  toggleCrossoverGate: (gate: keyof CrossoverState) => void;
  onTranscribe: () => void;
  isTranscribing: boolean;
  sequencer: SequencerState;
  setSequencer: React.Dispatch<React.SetStateAction<SequencerState>>;
  // MIDI Learn Props
  learningId: string | null;
  setLearningId: React.Dispatch<React.SetStateAction<string | null>>;
  handleLearnMapping: (mappingId: string) => Promise<void>;
}) => {
  const mixerCanvasRef = useRef<HTMLCanvasElement>(null);

  const { isRecording, startCapture, stopCapture } = useCaptureRig(
    'extreamix-canvas', 
    audioEngine.getAudioStream()
  );

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
    <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-y-auto min-h-0 p-2 md:p-4 custom-scrollbar pb-32 xl:pb-4">
      {/* Mixer Console Area */}
      <div 
        className="xl:flex-[2.5] bg-surface-container-high/20 backdrop-blur-3xl rounded-3xl border border-white/10 p-4 md:p-6 flex flex-col gap-6 xl:overflow-hidden min-h-[400px] md:min-h-[500px] xl:min-h-0 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
           <div>
             <h3 className="font-headline font-black text-white text-lg md:text-xl tracking-tighter uppercase leading-none italic glow-text">SIGNAL_CONSOLE_v4</h3>
             <span className="text-[8px] md:text-[9px] text-outline font-headline tracking-[0.2em] uppercase">Core Audio Mixing Engine</span>
           </div>
           
           <div className="flex items-center gap-6">
              {/* Master Volume Fader */}
              <div className="flex flex-col items-center gap-1 bg-black/40 border border-white/5 px-4 py-1.5 rounded-2xl">
                 <span className="font-headline text-[7px] text-outline tracking-widest uppercase mb-2">Master</span>
                 <input 
                   type="range" min="0" max="1" step="0.01" 
                   value={sequencer.masterVolume}
                   onChange={e => {
                     const val = parseFloat(e.target.value);
                     setSequencer(prev => ({ ...prev, masterVolume: val }));
                   }}
                   className="h-24 w-2 appearance-none bg-surface-container-highest rounded-full accent-primary cursor-pointer"
                   style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
                 />
              </div>
           </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto min-h-0 pb-10 custom-scrollbar pr-2">
          {channels.map(channel => (
            <div key={channel.id} className="flex flex-col gap-4 bg-surface-container-high/60 border border-white/5 p-4 rounded-3xl relative group backdrop-blur-md shadow-lg">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Music className="w-4 h-4 text-primary" /></div>
              
              {/* Channel Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Volume2 className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-headline text-sm text-white font-black uppercase glow-text">{channel.name}</h4>
                </div>
                <IconButton 
                  icon={Trash2} 
                  label="Remove Channel" 
                  onClick={() => updateChannel(channel.id, { active: false })} 
                  className="text-error hover:bg-error/20" 
                />
              </div>

              {/* Channel Volume Fader */}
              <div className="flex-1 flex gap-2 z-10 min-h-0">
                 <div className="flex-1 bg-black/40 rounded-2xl p-2 flex items-stretch gap-2 border border-white/5">
                    <VUMeter analyser={audioEngine.getChannelAnalyser(channel.id)} orientation="vertical" className="w-1.5 h-full opacity-100" />
                    
                    <div className="flex-1 flex flex-col items-center relative">
                       <input 
                        type="range" min="0" max="1.5" step="0.01" 
                        value={channel.volume}
                        onChange={e => {
                           const val = parseFloat(e.target.value);
                           updateChannel(channel.id, { volume: val });
                        }}
                        className="h-full w-2 appearance-none bg-surface-container-highest rounded-full accent-primary cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
                      />
                    </div>
                 </div>

                 {/* Channel FX Shortcuts */}
                 <div className="w-8 flex flex-col justify-around bg-black/40 rounded-xl py-2 border border-white/5">
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
                         <span className="text-[6px] font-black">LERN</span>
                      </button>
                    )))}
                 </div>
              </div>

              {/* Detailed FX Controls (mini) */}
              <div className="z-10 grid grid-cols-2 gap-2 bg-surface-container-lowest/30 p-2 rounded-xl">
                 <div className="flex flex-col gap-1">
                    <div className="font-headline text-[6px] text-outline uppercase tracking-widest">FIX_AMT (P)</div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={channel.pitchCorrection}
                      onChange={e => updateChannel(channel.id, { pitchCorrection: parseFloat(e.target.value) })}
                      className="w-full h-0.5 bg-surface-container-highest appearance-none rounded-full accent-tertiary cursor-pointer touch-none"
                    />
                 </div>
                 <div className="flex flex-col gap-1">
                    <div className="font-headline text-[6px] text-outline uppercase tracking-widest">FIX_AMT (B)</div>
                    <input 
                      type="range" min="0" max="1" step="0.01" value={channel.beatCorrection}
                      onChange={e => updateChannel(channel.id, { beatCorrection: parseFloat(e.target.value) })}
                      className="w-full h-0.5 bg-surface-container-highest appearance-none rounded-full accent-tertiary cursor-pointer touch-none"
                    />
                 </div>
              </div>

               {/* EQ Controls */}
               <div className="flex items-end gap-3 z-10 bg-surface-container-lowest/30 p-2 rounded-xl">
                 <div className="font-headline text-[9px] text-white uppercase tracking-wider font-bold -rotate-90 origin-bottom-left whitespace-nowrap hidden lg:block">EQ</div>
                 {[ 
                   { key: 'low' as const, label: 'LOW', color: 'accent-secondary' },
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
                     <div className="font-headline text-[7px] text-outline uppercase font-black">LERN</div>
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
                   className={`py-2 rounded-lg font-headline text-[10px] uppercase font-black transition-all ${channel.solo ? 'bg-tertiary text-on-tertiary-container shadow-[0_0_10px_rgba(86,229,169,0.3)]' : 'bg-surface-container-highest text-outline hover:text-white'}`}
                 >
                   SOLO
                 </button>
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
                        className="h-full w-2 appearance-none bg-surface-container-highest rounded-full accent-primary cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
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
                          <IconButton 
                             key={fx.id} 
                             icon={fx.icon} 
                             label={fx.label}
                             active={isActive} 
                             onClick={() => setSequencer(prev => ({ 
                                ...prev, 
                                masterFX: { 
                                   ...prev.masterFX, 
                                   [fx.id]: { ...prev.masterFX[fx.id], active: !isActive } 
                                } 
                             }))} 
                             className="w-full h-8"
                          />
                       );
                    })}
                 </div>
              </div>

              {/* RECORDING CONTROLS */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="font-headline text-[9px] text-outline tracking-[0.3em] uppercase">CAPTURE_RIG</div>
                <IconButton 
                  icon={isRecording ? Square : Video} 
                  label={isRecording ? "Stop Recording" : "Start Recording"}
                  active={isRecording} 
                  onClick={isRecording ? stopCapture : startCapture} 
                  className={`w-12 h-12 rounded-full border-2 ${isRecording ? 'border-error/50 bg-error/20 text-error animate-pulse' : 'border-white/10 bg-black/40 text-white/60'}`}
                />
              </div>
           </div>
        </div>

        <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-4">
          <IconButton icon={Play} label="Play" onClick={() => audioEngine.start(sequencer.bpm)} active={audioEngine.isPlaying()} />
          <IconButton icon={Square} label="Stop" onClick={() => audioEngine.stop()} active={!audioEngine.isPlaying()} />
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-outline uppercase">BPM:</span>
            <input 
              type="number" 
              value={sequencer.bpm}
              onChange={e => {
                const val = Math.max(1, Math.min(300, parseInt(e.target.value) || 120));
                setSequencer(prev => ({ ...prev, bpm: val }));
                audioEngine.setBPM(val);
              }}
              className="bg-surface-container-highest text-primary font-mono text-sm w-16 px-2 py-1 rounded-lg border border-white/10 outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-outline uppercase">BEAT:</span>
            <span className="font-mono text-xs text-primary">{sequencer.currentBeat + 1}</span>
          </div>

          <IconButton 
            icon={Mic} 
            label="Transcribe" 
            onClick={onTranscribe} 
            active={isTranscribing} 
            className={`ml-auto ${isTranscribing ? 'text-error bg-error/20' : ''}`}
          />
          <input 
            type="text" 
            placeholder="Say something..." 
            value={transcripts[0] || ''}
            readOnly
            className="flex-1 bg-surface-container-highest text-white font-mono text-sm px-3 py-2 rounded-lg border border-white/10 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

const FilterMatrixView = ({
  crossoverGates,
  toggleCrossoverGate,
  matrixMappings,
  updateMatrixMapping,
  channels,
  sequencer,
  // MIDI Learn Props
  learningId,
  setLearningId,
  handleLearnMapping,
}: {
  crossoverGates: CrossoverState;
  toggleCrossoverGate: (gate: keyof CrossoverState) => void;
  matrixMappings: MatrixMapping[];
  updateMatrixMapping: (id: string, update: Partial<MatrixMapping>) => void;
  channels: ChannelState[];
  sequencer: SequencerState;
  // MIDI Learn Props
  learningId: string | null;
  setLearningId: React.Dispatch<React.SetStateAction<string | null>>;
  handleLearnMapping: (mappingId: string) => Promise<void>;
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 pb-32 md:pb-8 lg:pb-12 overflow-y-auto custom-scrollbar bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem)]">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-end border-b border-primary/20 pb-4">
           <div>
             <h2 className="font-headline text-3xl md:text-4xl text-primary font-black tracking-tighter uppercase leading-none italic glow-text">CROSSOVER_MATRIX</h2>
             <p className="font-headline text-[10px] text-outline tracking-widest uppercase mt-2">Frequency Band Routing / Gain Control</p>
           </div>
           <div className="flex gap-2">
              <span className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-xl font-headline text-[9px] tracking-[0.2em] font-black uppercase shadow-[0_0_15px_rgba(56,189,248,0.2)]">ACTIVE_FILTERING</span>
           </div>
        </div>

        {/* Crossover Gates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[ 
            { id: 'low' as const, label: 'LOW (0-200Hz)', icon: Disc, color: 'primary' },
            { id: 'mid' as const, label: 'MID (200-3000Hz)', icon: Waves, color: 'tertiary' },
            { id: 'high' as const, label: 'HIGH (3000Hz+)', icon: Wind, color: 'primary' },
          ].map(gate => (
            <div key={gate.id} className="bg-surface-container-high/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md group hover:border-primary/40 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full border-2 border-outline/20 relative flex items-center justify-center">
                    <gate.icon className={`w-5 h-5 ${crossoverGates[gate.id] ? 'text-primary animate-pulse' : 'text-outline'}`} />
                 </div>
                 <div>
                    <div className="font-headline text-sm text-white font-black uppercase leading-none tracking-tight">{gate.label}</div>
                    <div className="font-mono text-[9px] text-outline mt-1">{crossoverGates[gate.id] ? 'ACTIVE' : 'INACTIVE'}</div>
                 </div>
              </div>
              <button 
                onClick={() => toggleCrossoverGate(gate.id)}
                className={`px-4 py-2 rounded-lg font-headline text-[10px] uppercase font-black transition-all ${crossoverGates[gate.id] ? 'bg-primary text-on-primary-container shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'bg-black/40 text-outline hover:text-white border border-white/10'}`}
              >
                {crossoverGates[gate.id] ? 'DEACTIVATE' : 'ACTIVATE'}
              </button>
            </div>
          ))}
        </div>

        {/* Routing Grid */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <RouteIcon className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-xs text-white uppercase tracking-[0.3em] font-black">Audio_Route_Matrix</h3>
          </div>
          <div className="bg-surface-container-high/60 border border-white/5 rounded-2xl p-4 md:p-6 backdrop-blur-md">
            <div className="grid grid-cols-[100px_repeat(4,1fr)] md:grid-cols-[150px_repeat(4,1fr)] gap-2 mb-4">
              <div className="text-[8px] md:text-[9px] text-outline font-headline uppercase tracking-wider font-bold">Source</div>
              {['Low', 'Mid', 'High', 'Master'].map(dest => (
                <div key={dest} className="text-[8px] md:text-[9px] text-outline font-headline uppercase tracking-wider font-bold text-center">{dest}</div>
              ))}
            </div>
            {channels.map(channel => (
              <div key={channel.id} className="grid grid-cols-[100px_repeat(4,1fr)] md:grid-cols-[150px_repeat(4,1fr)] gap-2 mb-2 items-center">
                <div className="font-headline text-[9px] text-white uppercase truncate">{channel.name}</div>
                {['low', 'mid', 'high', 'master'].map(destKey => {
                  const dest = destKey as RoutingDestination;
                  const isConnected = channel.routing.includes(dest);
                  return (
                    <button 
                      key={dest} 
                      onClick={() => {
                        const newRouting = isConnected
                          ? channel.routing.filter(d => d !== dest)
                          : [...channel.routing, dest];
                        updateChannel(channel.id, { routing: newRouting });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[9px] font-headline uppercase font-black transition-all flex items-center justify-center gap-1 ${isConnected ? 'bg-primary text-on-primary-container' : 'bg-surface-container-highest text-outline hover:bg-surface-container-highest/50'}`}
                    >
                      {isConnected && <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#38bdf8]" />}
                      {dest.slice(0, 1).toUpperCase() + dest.slice(1)}
                      {!isConnected && <div className="w-1 h-1 bg-white/10 rounded-full group-hover/node:bg-white/30 transition-colors" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MatrixView = ({
  mappings,
  learningId,
  setLearningId,
  handleLearnMapping,
}: {
  mappings: MatrixMapping[];
  learningId: string | null;
  setLearningId: React.Dispatch<React.SetStateAction<string | null>>;
  handleLearnMapping: (mappingId: string) => Promise<void>;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 pb-32 md:pb-8 lg:pb-12 overflow-y-auto custom-scrollbar bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem)]">
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
                         {learningId === m.id ? (
                            <div className="bg-black border border-primary/40 px-4 py-2 rounded-lg font-mono text-xs text-primary font-bold shadow-inner animate-pulse">
                               AWAITING_MIDI_SIGNAL
                            </div>
                         ) : (
                            <div className="flex items-center gap-2">
                               <div className="bg-black border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-primary font-bold shadow-inner">
                                  {m.midiCC !== null ? String(m.midiCC).padStart(3, '0') : '---'}
                               </div>
                               <button 
                                 onClick={() => handleLearnMapping(m.id)}
                                 className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg font-headline text-[9px] uppercase tracking-widest hover:bg-primary/40 transition-all"
                                 title="Learn MIDI CC"
                               >
                                 [LEARN]
                               </button>
                            </div>
                         )}
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
                         {learningId === m.id ? (
                            <div className="bg-black border border-tertiary/40 px-4 py-2 rounded-lg font-mono text-xs text-tertiary font-bold shadow-inner animate-pulse">
                               AWAITING_MIDI_SIGNAL
                            </div>
                         ) : (
                            <div className="flex items-center gap-2">
                               <div className="bg-black border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-tertiary font-bold shadow-inner">
                                  {m.midiCC !== null ? String(m.midiCC).padStart(3, '0') : '---'}
                               </div>
                               <button 
                                 onClick={() => handleLearnMapping(m.id)}
                                 className="px-3 py-1.5 bg-tertiary/20 text-tertiary rounded-lg font-headline text-[9px] uppercase tracking-widest hover:bg-tertiary/40 transition-all"
                                 title="Learn MIDI CC"
                               >
                                 [LEARN]
                               </button>
                            </div>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const RegistryView = ({
  presets,
  onLoadPreset,
}: {
  presets: RegistryPreset[];
  onLoadPreset: (patchData: string) => void;
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 pb-32 md:pb-8 lg:pb-12 overflow-y-auto custom-scrollbar bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem)]">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-end border-b border-primary/20 pb-4">
           <div>
             <h2 className="font-headline text-3xl md:text-4xl text-primary font-black tracking-tighter uppercase leading-none italic glow-text">REGISTRY_HUB_V2</h2>
             <p className="font-headline text-[10px] text-outline tracking-widest uppercase mt-2">Preset Manager & Global Patch Library</p>
           </div>
           <div className="flex gap-2">
              <span className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-xl font-headline text-[9px] tracking-[0.2em] font-black uppercase shadow-[0_0_15px_rgba(56,189,248,0.2)]">SYNCHRONIZED_CLOUD</span>
           </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {presets.map(preset => (
            <motion.div 
              key={preset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-surface-container-high/60 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex flex-col gap-4 shadow-lg hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <LibraryIcon className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-headline text-lg text-white font-black uppercase leading-none tracking-tight glow-text-small">{preset.name}</h3>
                  <p className="font-mono text-[9px] text-outline mt-1">LAST_MOD: {preset.lastModified}</p>
                </div>
              </div>
              <p className="font-mono text-xs text-white/80 leading-relaxed flex-1">{preset.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {preset.tags.map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary text-[8px] font-mono px-2 py-1 rounded-full uppercase">{tag}</span>
                  ))}
                </div>
                <button 
                  onClick={() => onLoadPreset(preset.patchData)}
                  className="px-4 py-2 bg-primary text-on-primary-container rounded-lg font-headline text-[10px] uppercase font-black shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:opacity-90 transition-opacity"
                >
                  LOAD_PRESET
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};


const App = () => {
  const [isLaunched, setIsLaunched] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('extreamix_isLaunched') === 'true';
    }
    return false;
  });
  const [currentView, setCurrentView] = useState<View>('console');
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [sources, setSources] = useState<VideoSource[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_sources');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 'default-cam', name: 'Webcam Feed', type: 'camera', stream: null, active: true, opacity: 1, scale: 1, position: { x: 0, y: 0 }, blendMode: 'source-over', zIndex: 1, customFilterId: null, pitchCorrection: 0, beatCorrection: 0, pulseRouting: [] }
    ];
  });
  const [channels, setChannels] = useState<ChannelState[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_channels');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 'ch1', name: 'Main_Mix', volume: 0.8, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: { delay: { active: false }, reverb: { active: false }, chorus: { active: false }, phaser: { active: false } }, pitchCorrection: 0, beatCorrection: 0, pulseRouting: [], routing: ['master'] },
      { id: 'ch2', name: 'Mic_In', volume: 0.5, mute: false, solo: false, eq: { low: 0, mid: 0, high: 0 }, fx: { delay: { active: false }, reverb: { active: false }, chorus: { active: false }, phaser: { active: false } }, pitchCorrection: 0, beatCorrection: 0, pulseRouting: [], routing: ['master'] },
    ];
  });
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sequencer, setSequencer] = useState<SequencerState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_sequencer');
      if (saved) return JSON.parse(saved);
    }
    return {
      bpm: 120,
      currentBeat: 0,
      tracks: [
        { id: 't1', name: 'Kick', active: true, volume: 1, pan: 0, division: 4, length: 4, sequence: [1, 0, 0, 0], triggerNode: null },
        { id: 't2', name: 'Snare', active: true, volume: 1, pan: 0, division: 4, length: 4, sequence: [0, 0, 1, 0], triggerNode: null },
        { id: 't3', name: 'HiHat', active: true, volume: 1, pan: 0, division: 8, length: 8, sequence: [1, 0, 1, 0, 1, 0, 1, 0], triggerNode: null },
      ],
      masterVolume: 1,
      masterFX: { delay: { active: false }, reverb: { active: false }, chorus: { active: false }, phaser: { active: false } },
    };
  });
  const [crossoverGates, setCrossoverGates] = useState<CrossoverState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('extreamix_crossoverGates');
      if (saved) return JSON.parse(saved);
    }
    return { low: false, mid: false, high: false };
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
  const [registryPresets, setRegistryPresets] = useState<RegistryPreset[]>([
    { id: 'p1', name: 'HYPER_DRIVE_01', description: 'Aggressive compression and extreme RGB splitting.', tags: ['AGGR', 'SYNC'], lastModified: '2026-04-18', patchData: '{"filters":{"low":-3,"mid":-2,"high":2},"uniforms":{"rgbSplit":0.2,"pixelation":0.05}}' },
    { id: 'p2', name: 'VOID_AMBIENCE', description: 'Submersive low-pass routing with heavy pixelation.', tags: ['VOID', 'LO'], lastModified: '2026-04-17', patchData: '{"filters":{"low":5,"mid":-5,"high":-8},"uniforms":{"pixelation":0.8,"glow":0.1}}' },
  ]);

  // Master Limiter state for LED feedback in Console
  const [masterLimiterActive, setMasterLimiterActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [learningId, setLearningId] = useState<string | null>(null);
  const [customVideoFilters, setCustomVideoFilters] = useState<CustomVideoFilter[]>([
    {id: 'f1', name: 'VHS Glitch', shaderCode: 'precision mediump float;\nuniform sampler2D u_image;\nuniform float u_time;\nvarying vec2 v_texCoord;\nvoid main() {\n  vec2 uv = v_texCoord;\n  float glitch = sin(uv.y * 30.0 + u_time * 10.0) * 0.01;\n  gl_FragColor = texture2D(u_image, vec2(uv.x + glitch, uv.y));\n}'},
    {id: 'f2', name: 'RGB Shift', shaderCode: 'precision mediump float;\nuniform sampler2D u_image;\nuniform float u_time;\nvarying vec2 v_texCoord;\nvoid main() {\n  vec2 uv = v_texCoord;\n  vec4 color;\n  color.r = texture2D(u_image, uv + vec2(sin(u_time * 2.0) * 0.01, 0.0)).r;\n  color.g = texture2D(u_image, uv + vec2(sin(u_time * 2.0 + 2.0) * 0.01, 0.0)).g;\n  color.b = texture2D(u_image, uv + vec2(sin(u_time * 2.0 + 4.0) * 0.01, 0.0)).b;\n  color.a = 1.0;\n  gl_FragColor = color;\n}'}
  ]);

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

  useEffect(() => {
    audioEngine.updateTracks(sequencer.tracks);
  }, [sequencer.tracks]);

  // Master Engine Sync
  useEffect(() => {
    audioEngine.setMasterVolume(sequencer.masterVolume);
    audioEngine.updateMasterFX(sequencer.masterFX);
  }, [sequencer.masterVolume, sequencer.masterFX]);

  // Channel Sync
  useEffect(() => {
    channels.forEach(channel => {
      audioEngine.updateChannelVolume(channel.id, channel.volume);
      audioEngine.updateChannelMute(channel.id, channel.mute);
      audioEngine.updateChannelSolo(channel.id, channel.solo);
      audioEngine.updateChannelEQ(channel.id, channel.eq);
      audioEngine.updateChannelFX(channel.id, channel.fx);
      audioEngine.updateChannelPitchCorrection(channel.id, channel.pitchCorrection);
      audioEngine.updateChannelBeatCorrection(channel.id, channel.beatCorrection);
      audioEngine.updateChannelRouting(channel.id, channel.routing);
      audioEngine.updateChannelPulseRouting(channel.id, channel.pulseRouting);
    });
  }, [channels]);

  // Video Sync
  useEffect(() => {
    videoEngine.updateSources(sources);
  }, [sources]);

  // Cross-engine sync (sequencer BPM to audio engine)
  useEffect(() => {
    audioEngine.setBPM(sequencer.bpm);
  }, [sequencer.bpm]);

  // Initialize midiService
  useEffect(() => {
    midiService.init();
    midiService.onCCMessage = (ccNumber, value) => {
      if (learningId) {
        // If in learn mode, resolve the promise
        midiService.resolveLearnPromise(ccNumber);
        setLearningId(null);
      } else {
        // If not in learn mode, apply to a mapped control
        const mappedControl = matrixMappings.find(m => m.midiCC === ccNumber);
        if (mappedControl) {
          // Implement logic to update corresponding audio/video param with 'value'
          console.log(`MIDI CC ${ccNumber} received with value ${value}, mapped to ${mappedControl.target}`);
          // Example: update a matrix mapping's value based on MIDI CC input
          setMatrixMappings(prevMappings =>
            prevMappings.map(m =>
              m.id === mappedControl.id ? { ...m, value: value / 127 } : m // Normalize MIDI value (0-127) to 0-1
            )
          );
        }
      }
    };
    midiService.onStateChange = (event) => {
      console.log(`MIDI State Change: ${event.port.name} - ${event.port.state}`);
    };

    return () => {
      // midiService.destroy(); // Implement if MidiService needs explicit cleanup
    };
  }, [learningId, matrixMappings, setMatrixMappings]); // Depend on learningId and matrixMappings for updates

  const updateMatrixMapping = useCallback((id: string, update: Partial<MatrixMapping>) => {
    setMatrixMappings(prev => prev.map(m => (m.id === id ? { ...m, ...update } : m)));
  }, []);

  const handleLearnMapping = useCallback(async (mappingId: string) => {
    if (learningId === mappingId) {
      // Already learning for this ID, cancel it
      midiService.resolveLearnPromise(null); // Explicitly resolve with null to cancel
      setLearningId(null);
      return;
    }
    setLearningId(mappingId);
    try {
      const cc = await midiService.engageLearnMode(mappingId);
      if (cc !== null) {
        console.log(`Learned MIDI CC ${cc} for mapping ${mappingId}`);
        updateMatrixMapping(mappingId, { midiCC: cc });
      } else {
        console.log(`MIDI learn for ${mappingId} timed out.`);
      }
    } catch (error) {
      console.error(`MIDI learn error for ${mappingId}:`, error);
    } finally {
      setLearningId(null); // Always clear learning state
    }
  }, [learningId, updateMatrixMapping, setLearningId]);


  const handleSetMasterLimiterActive = useCallback((active: boolean) => {
    setMasterLimiterActive(active);
  }, []);

  const addChannel = useCallback(() => {
    setChannels(prev => [
      ...prev,
      { 
        id: `ch${prev.length + 1}`, 
        name: `New_Channel_${prev.length + 1}`, 
        volume: 0.7,
        mute: false,
        solo: false,
        eq: { low: 0, mid: 0, high: 0 },
        fx: { delay: { active: false }, reverb: { active: false }, chorus: { active: false }, phaser: { active: false } },
        pitchCorrection: 0,
        beatCorrection: 0,
        pulseRouting: [],
        routing: ['master'],
      },
    ]);
  }, []);

  const updateChannel = useCallback((id: string, update: Partial<ChannelState>) => {
    setChannels(prev => prev.map(channel => (channel.id === id ? { ...channel, ...update } : channel)));
  }, []);

  const toggleCrossoverGate = useCallback((gate: keyof CrossoverState) => {
    setCrossoverGates(prev => ({ ...prev, [gate]: !prev[gate] }));
  }, []);

  // Transcribing Audio (Whisper)
  const handleTranscribe = useCallback(async () => {
    if (isTranscribing) return;
    setIsTranscribing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        // Dummy API call for transcription
        // Replace with actual API endpoint (e.g., your Cloud Run service)
        // const response = await fetch('/api/transcribe', {
        //   method: 'POST',
        //   body: formData,
        // });
        // const data = await response.json();
        // setTranscripts(prev => [data.text, ...prev]);

        // Mock transcription for now
        setTimeout(() => {
          const mockText = `[Mock] User said: Lorem ipsum dolor sit amet, consectetur adipiscing elit. (${new Date().toLocaleTimeString()})`;
          setTranscripts(prev => [mockText, ...prev]);
          setIsTranscribing(false);
        }, 1500);
      };

      recorder.start();
      setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 5000); // Record for 5 seconds

    } catch (error) {
      console.error('Error accessing microphone for transcription:', error);
      setIsTranscribing(false);
    }
  }, [isTranscribing]);

  const addSource = useCallback(() => {
    setSources(prev => [
      ...prev,
      { 
        id: `src${prev.length + 1}`, 
        name: `New_Source_${prev.length + 1}`, 
        type: 'image', 
        url: 'https://source.unsplash.com/random/1920x1080', 
        stream: null, 
        active: true, 
        opacity: 1, 
        scale: 1, 
        position: { x: 0, y: 0 }, 
        blendMode: 'source-over', 
        zIndex: prev.length + 1,
        customFilterId: null,
        pitchCorrection: 0,
        beatCorrection: 0,
        pulseRouting: [],
      },
    ]);
  }, []);

  const addCameraSource = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacingMode } });
      setSources(prev => [
        ...prev,
        { 
          id: `cam${prev.length + 1}`, 
          name: `${cameraFacingMode === 'user' ? 'Front' : 'Back'} Camera`, 
          type: 'camera', 
          stream: stream, 
          active: true, 
          opacity: 1, 
          scale: 1, 
          position: { x: 0, y: 0 }, 
          blendMode: 'source-over', 
          zIndex: prev.length + 1,
          customFilterId: null,
          pitchCorrection: 0,
          beatCorrection: 0,
          pulseRouting: [],
        },
      ]);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please ensure permissions are granted.');
    }
  }, [cameraFacingMode]);

  const updateSource = useCallback((id: string, update: Partial<VideoSource>) => {
    setSources(prev => prev.map(source => (source.id === id ? { ...source, ...update } : source)));
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
  }, []);

  const loadPreset = useCallback((patchData: string) => {
    try {
      const patch = JSON.parse(patchData);
      audioEngine.applyPatch(patch);
      videoEngine.applyPatch(patch);
      console.log('Applied preset patch:', patch);
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  }, []);

  const { user, isPro, isLoading, login, logout } = useSubscription();

  // Admin check (simple for now, replace with actual auth/roles)
  const isAdmin = typeof window !== 'undefined' && user?.id === import.meta.env.VITE_ADMIN_USER_ID;

  if (!isLaunched) {
    return <LandingPage onLaunch={() => setIsLaunched(true)} onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col md:flex-row font-sans relative">
      {/* Global Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-20" style={{ background: 'radial-gradient(circle at top left, #38bdf840, transparent 50%), radial-gradient(circle at bottom right, #56e5a940, transparent 50%)' }}></div>

      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-20 md:min-w-[80px] bg-surface-container-low/80 backdrop-blur-2xl border-t border-white/5 md:border-t-0 md:border-r md:pt-6 flex flex-row md:flex-col items-center justify-around md:justify-start gap-1 md:gap-2 z-40">
        <div className="hidden md:flex items-center justify-center p-4">
          <img src="/extreamix_logo_icon.svg" alt="Extreamix Logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
        </div>
        <NavItem icon={Play} label="Console" active={currentView === 'console'} onClick={() => setCurrentView('console')} />
        <NavItem icon={LayoutGrid} label="Imaging" active={currentView === 'imaging'} onClick={() => setCurrentView('imaging')} />
        <NavItem icon={SlidersHorizontal} label="Crossover" active={currentView === 'filter-matrix'} onClick={() => setCurrentView('filter-matrix')} />
        <NavItem icon={RouteIcon} label="Matrix" active={currentView === 'matrix-mapper'} onClick={() => setCurrentView('matrix-mapper')} />
        <NavItem icon={LibraryIcon} label="Registry" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
        <NavItem icon={PackagePlus} label="Addons" active={currentView === 'addons'} onClick={() => setCurrentView('addons')} />
        <NavItem icon={User} label="Profile" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
        {isAdmin && (
          <NavItem icon={Shield} label="Admin" active={currentView === 'admin'} onClick={() => setCurrentView('admin')} />
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-4 pb-20 md:py-4 md:pl-4 min-h-screen relative z-10">
        <div className="flex-1 flex flex-col bg-surface-container/60 rounded-3xl backdrop-blur-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <img src="/extreamix_logo_icon.svg" alt="Extreamix Logo" className="w-6 h-6 md:w-8 md:h-8 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] md:hidden" />
              <h1 className="font-headline text-xl md:text-2xl text-white font-black tracking-tighter uppercase leading-none italic glow-text">{currentView.replace('-', ' ')}</h1>
              <span className="bg-primary/10 text-primary text-[8px] font-mono px-2 py-1 rounded-full uppercase">v0.9.0</span>
            </div>
            <div className="flex items-center gap-4">
              {!isPro && <AdBanner className="hidden sm:block" />}
              <button onClick={logout} className="px-4 py-2 bg-white/10 text-white rounded-lg font-headline text-[10px] uppercase font-black hover:bg-white/20 transition-all">LOGOUT</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {currentView === 'console' && (
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
                learningId={learningId}
                setLearningId={setLearningId}
                handleLearnMapping={handleLearnMapping}
              />
            )}
            {currentView === 'imaging' && (
              <ImagingView 
                sources={sources}
                onUpdate={updateSource}
                onRemove={removeSource}
                onAdd={addSource}
                onAddCamera={addCameraSource}
                channels={channels}
                activeSourceId={activeSourceId}
                sequencer={sequencer}
                cameraFacingMode={cameraFacingMode}
                setCameraFacingMode={setCameraFacingMode}
                customFilters={customVideoFilters}
              />
            )}
            {currentView === 'filter-designer' && (
              <FilterDesignerView 
                activeEntitlements={activeEntitlements}
                customFilters={customVideoFilters}
                setCustomFilters={setCustomVideoFilters}
              />
            )}
            {currentView === 'filter-matrix' && (
              <FilterMatrixView 
                crossoverGates={crossoverGates}
                toggleCrossoverGate={toggleCrossoverGate}
                matrixMappings={matrixMappings}
                updateMatrixMapping={updateMatrixMapping}
                channels={channels}
                sequencer={sequencer}
                learningId={learningId}
                setLearningId={setLearningId}
                handleLearnMapping={handleLearnMapping}
              />
            )}
            {currentView === 'matrix-mapper' && (
              <MatrixView
                mappings={matrixMappings}
                learningId={learningId}
                setLearningId={setLearningId}
                handleLearnMapping={handleLearnMapping}
              />
            )}
            {currentView === 'library' && (
              <RegistryView 
                presets={registryPresets}
                onLoadPreset={loadPreset}
              />
            )}
            {currentView === 'addons' && (
              <AddonsView 
                activeEntitlements={activeEntitlements}
                isPro={isPro}
                onPurchaseAddon={purchaseAddon}
              />
            )}
            {currentView === 'profile' && (
              <ProfileView 
                user={user}
                logout={logout}
                isPro={isPro}
                activeEntitlements={activeEntitlements}
              />
            )}
            {isAdmin && currentView === 'admin' && (
              <AdminDashboard />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
