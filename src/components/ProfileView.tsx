import { useState, useEffect } from 'react';
import { 
  LogOut, User, Key, Bell, Shield, Wallet, Palette, Sparkles, Wand2, PaintBucket, Crown, ExternalLink,
  Volume2, Monitor, Keyboard, Download, Upload, Globe, Clock, SlidersHorizontal, Mic, Video,
  Cpu, Wifi, Eye, Trash2, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { ENTITLEMENTS } from '../services/revenueCat';
import type { SubscriptionState } from '../hooks/useSubscription';

interface ProfileViewProps {
  subscription: SubscriptionState;
  onOpenManagement: () => void;
}

const TIER_BADGE_COLORS: Record<string, string> = {
  'Pulse (Free)': 'bg-white/10 text-outline',
  'Studio': 'bg-primary/20 text-primary border-primary/30',
  'Broadcast': 'bg-tertiary/20 text-tertiary border-tertiary/30',
};

export const ProfileView = ({ subscription, onOpenManagement }: ProfileViewProps) => {
  const [customBg, setCustomBg] = useState('#0c1324');
  const [customPrimary, setCustomPrimary] = useState('#8ed5ff');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio preferences (persisted to localStorage)
  const [audioSampleRate, setAudioSampleRate] = useState(() => localStorage.getItem('extreamix_audio_sr') || '48000');
  const [audioBitDepth, setAudioBitDepth] = useState(() => localStorage.getItem('extreamix_audio_bd') || '24');
  const [audioBufferSize, setAudioBufferSize] = useState(() => localStorage.getItem('extreamix_audio_buf') || '256');
  const [audioLatencyMode, setAudioLatencyMode] = useState<'ultra' | 'low' | 'stable'>(() => 
    (localStorage.getItem('extreamix_audio_latency') as any) || 'low'
  );

  // Video preferences
  const [videoResolution, setVideoResolution] = useState(() => localStorage.getItem('extreamix_video_res') || '1080p');
  const [videoFps, setVideoFps] = useState(() => localStorage.getItem('extreamix_video_fps') || '30');
  const [videoColorSpace, setVideoColorSpace] = useState(() => localStorage.getItem('extreamix_video_cs') || 'sRGB');

  // App preferences
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('extreamix_reduced_motion') === 'true');
  const [showFpsCounter, setShowFpsCounter] = useState(() => localStorage.getItem('extreamix_show_fps') === 'true');
  const [autoSavePresets, setAutoSavePresets] = useState(() => localStorage.getItem('extreamix_autosave') !== 'false');
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState(() => localStorage.getItem('extreamix_confirm_del') !== 'false');

  const { isPro, planName, expirationDate, willRenew, activeEntitlements } = subscription;
  const badgeClass = TIER_BADGE_COLORS[planName] || TIER_BADGE_COLORS['Pulse (Free)'];
  const userId = localStorage.getItem('extreamix_rc_user_id') || 'Unknown';
  const activeAddons = activeEntitlements.filter(e => e !== ENTITLEMENTS.PRO);

  const applyCustomTheme = (bg: string, primary: string) => {
    document.documentElement.setAttribute('data-theme', 'custom');
    document.documentElement.style.setProperty('--custom-bg', bg);
    document.documentElement.style.setProperty('--custom-primary', primary);
  };
  
  const handleAIGenerate = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setTimeout(() => {
      const h = Math.floor(Math.random() * 360);
      const bg = `hsl(${h}, 30%, 10%)`; 
      const pri = `hsl(${(h + 180) % 360}, 80%, 60%)`;
      applyCustomTheme(bg, pri);
      setCustomBg(bg);
      setCustomPrimary(pri);
      setIsGenerating(false);
      setAiPrompt('');
    }, 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Persist settings to localStorage
  const persistSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const handleExportData = () => {
    const exportData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('extreamix_')) {
        try {
          exportData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          exportData[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extreamix-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          });
          window.location.reload();
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-8 space-y-8 font-sans custom-scrollbar">
      <div className="flex items-center gap-4 text-primary">
        <User className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest font-headline">User Profile</h2>
          <p className="text-outline text-xs tracking-wider uppercase font-mono">Account // Preferences // Data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Left Column: Identity & Subscription --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden mb-4 relative group">
              <img src="https://picsum.photos/seed/sonicuser/150/150" alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <span className="text-[10px] uppercase font-bold tracking-widest">Change</span>
              </div>
            </div>
            <h3 className="font-headline font-black text-lg tracking-widest uppercase">Extreamix User</h3>
            <p className="text-outline text-xs font-mono mb-6 truncate max-w-full">{userId}</p>
            
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Status</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${isPro ? 'text-success' : 'text-outline'}`}>
                  {isPro ? 'Pro Active' : 'Free Tier'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Plan</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                  {isPro && <Crown className="w-3 h-3 inline mr-1" />}
                  {planName}
                </span>
              </div>
              {expirationDate && (
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Renews</span>
                  <span className="text-[10px] text-white uppercase tracking-wider font-bold">
                    {formatDate(expirationDate)}
                  </span>
                </div>
              )}
              {activeAddons.length > 0 && (
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Add-ons</span>
                  <span className="text-[10px] text-primary uppercase tracking-wider font-bold">
                    {activeAddons.length} active
                  </span>
                </div>
              )}
            </div>

            {(isPro || activeAddons.length > 0) && (
              <button 
                onClick={onOpenManagement}
                className="mt-4 w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl font-headline text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2"
              >
                <Wallet className="w-3 h-3" />
                MANAGE SUBSCRIPTION
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Security */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Key className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Security</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Display Name</label>
                <input type="text" defaultValue="Extreamix User" className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 flex items-center text-xs text-white outline-none focus:border-primary/50 transition-all font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-mono">User ID</label>
                <input type="text" value={userId} className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 flex items-center text-xs text-outline outline-none transition-all font-mono opacity-50 cursor-not-allowed" readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: All Settings --- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Theme & Appearance */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Palette className="w-4 h-4 text-tertiary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Interface & Theme</h4>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4 p-4 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Application Theme</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Select visual style for Extreamix interface</span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {[
                    { id: 'default', color: '#0c1324', primary: '#8ed5ff', name: 'Default Dark' },
                    { id: 'sunset', color: '#2a111a', primary: '#ffa3b1', name: 'Synth Sunset' },
                    { id: 'cyber', color: '#050a1f', primary: '#00f0ff', name: 'Cyberpunk' },
                    { id: 'emerald', color: '#021a11', primary: '#34d399', name: 'Matrix Emerald' },
                    { id: 'monochrome', color: '#000000', primary: '#ffffff', name: 'Monochrome' },
                    { id: 'bloodmoon', color: '#1a0505', primary: '#ff4d4d', name: 'Blood Moon' },
                    { id: 'deepocean', color: '#010a15', primary: '#00e5ff', name: 'Deep Ocean' },
                    { id: 'amethyst', color: '#14051f', primary: '#d470ff', name: 'Amethyst' }
                  ].map(theme => (
                    <div key={theme.id} className="flex flex-col items-center gap-2">
                      <button 
                        title={theme.name}
                        onClick={() => {
                          if (theme.id === 'default') {
                            document.documentElement.removeAttribute('data-theme');
                          } else {
                            document.documentElement.setAttribute('data-theme', theme.id);
                          }
                        }}
                        className="w-10 h-10 rounded-full border-2 border-white/20 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform hover:scale-110 flex items-center justify-center p-1 overflow-hidden focus:outline-none"
                      >
                        <div className="w-full h-full rounded-full flex flex-col overflow-hidden shadow-inner">
                          <div className="flex-1" style={{ backgroundColor: theme.color }}></div>
                          <div className="flex-[0.5]" style={{ backgroundColor: theme.primary }}></div>
                        </div>
                      </button>
                      <span className="text-[8px] uppercase tracking-widest text-outline font-bold text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[50px]">{theme.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Color Lab */}
              <div className="flex flex-col gap-4 p-4 bg-gradient-to-br from-surface-container/50 to-black/80 border border-white/5 rounded-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 z-10 relative">
                  <PaintBucket className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Custom Color Lab</span>
                    <span className="text-[10px] text-outline font-mono">Fine-tune your exact brand specifications</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10 relative">
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10">
                    <input 
                      type="color" 
                      value={customBg.startsWith('#') ? customBg : '#0c1324'} 
                      onChange={(e) => { 
                        setCustomBg(e.target.value); 
                        applyCustomTheme(e.target.value, customPrimary); 
                      }}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] text-outline uppercase font-bold tracking-widest">Base Surface</span>
                      <span className="text-xs text-white font-mono">{customBg}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10">
                    <input 
                      type="color" 
                      value={customPrimary.startsWith('#') ? customPrimary : '#8ed5ff'} 
                      onChange={(e) => { 
                        setCustomPrimary(e.target.value); 
                        applyCustomTheme(customBg, e.target.value); 
                      }}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-[10px] text-outline uppercase font-bold tracking-widest">Primary Accent</span>
                      <span className="text-xs text-white font-mono">{customPrimary}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Theme Forge */}
              <div className="flex flex-col gap-4 p-4 border border-primary/20 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <div className="flex items-center gap-2 z-10 relative mb-2">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-black text-white uppercase tracking-widest" style={{ textShadow: '0 0 10px var(--color-primary)' }}>AI Theme Forge</span>
                    <span className="text-[10px] text-primary/80 font-mono tracking-widest uppercase flex items-center gap-2">
                      {activeEntitlements.includes(ENTITLEMENTS.AI_THEME_FORGE) || isPro ? (
                        <>Add-on unlocked <Wand2 className="w-3 h-3" /></>
                      ) : (
                        <>Requires add-on purchase <Wand2 className="w-3 h-3" /></>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 z-10 relative">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., 'Retro Tokyo Arcade in the rain' or 'Minimalist Scandinavian wood'"
                    className="flex-1 bg-black/60 border border-primary/30 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-primary transition-all font-mono placeholder:text-outline/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                    disabled={!isPro && !activeEntitlements.includes(ENTITLEMENTS.AI_THEME_FORGE)}
                  />
                  <button 
                    onClick={handleAIGenerate}
                    disabled={!aiPrompt || isGenerating || (!isPro && !activeEntitlements.includes(ENTITLEMENTS.AI_THEME_FORGE))}
                    className="bg-primary hover:bg-primary-container text-black font-black uppercase tracking-widest text-[10px] px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Forging
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Audio Engine</h4>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Sample Rate</label>
                  <select 
                    value={audioSampleRate} 
                    onChange={(e) => { setAudioSampleRate(e.target.value); persistSetting('extreamix_audio_sr', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="44100">44.1 kHz</option>
                    <option value="48000">48 kHz</option>
                    <option value="96000">96 kHz (Pro)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Bit Depth</label>
                  <select 
                    value={audioBitDepth} 
                    onChange={(e) => { setAudioBitDepth(e.target.value); persistSetting('extreamix_audio_bd', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="16">16-bit</option>
                    <option value="24">24-bit</option>
                    <option value="32">32-bit Float (Pro)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Buffer Size</label>
                  <select 
                    value={audioBufferSize} 
                    onChange={(e) => { setAudioBufferSize(e.target.value); persistSetting('extreamix_audio_buf', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="128">128 samples (Ultra-low)</option>
                    <option value="256">256 samples (Low)</option>
                    <option value="512">512 samples (Balanced)</option>
                    <option value="1024">1024 samples (Stable)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Latency Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ultra', label: 'Ultra-Low', desc: '< 5ms, may glitch', color: 'text-yellow-400' },
                    { id: 'low', label: 'Low', desc: '~10ms, balanced', color: 'text-primary' },
                    { id: 'stable', label: 'Stable', desc: '~20ms, reliable', color: 'text-tertiary' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => { setAudioLatencyMode(mode.id as any); persistSetting('extreamix_audio_latency', mode.id); }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        audioLatencyMode === mode.id 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-surface-container border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-xs font-bold uppercase tracking-wider ${audioLatencyMode === mode.id ? mode.color : 'text-white/70'}`}>{mode.label}</div>
                      <div className="text-[9px] text-outline font-mono mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Settings */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Video className="w-4 h-4 text-tertiary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Video Engine</h4>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Output Resolution</label>
                  <select 
                    value={videoResolution} 
                    onChange={(e) => { setVideoResolution(e.target.value); persistSetting('extreamix_video_res', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="1440p">1440p QHD (Pro)</option>
                    <option value="4k">4K UHD (Pro)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Frame Rate</label>
                  <select 
                    value={videoFps} 
                    onChange={(e) => { setVideoFps(e.target.value); persistSetting('extreamix_video_fps', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="24">24 fps (Cinema)</option>
                    <option value="30">30 fps (Standard)</option>
                    <option value="60">60 fps (Smooth)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Color Space</label>
                  <select 
                    value={videoColorSpace} 
                    onChange={(e) => { setVideoColorSpace(e.target.value); persistSetting('extreamix_video_cs', e.target.value); }}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                  >
                    <option value="sRGB">sRGB (Web)</option>
                    <option value="DisplayP3">Display P3 (Wide)</option>
                    <option value="Rec2020">Rec. 2020 (HDR)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* App Preferences */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">App Preferences</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Reduced Motion</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Minimize animations for accessibility</span>
                </div>
                <button 
                  onClick={() => { setReducedMotion(!reducedMotion); persistSetting('extreamix_reduced_motion', String(!reducedMotion)); }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${reducedMotion ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-surface-container border border-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${reducedMotion ? 'right-1 bg-black' : 'left-1 bg-outline'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Show FPS Counter</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Display render performance overlay</span>
                </div>
                <button 
                  onClick={() => { setShowFpsCounter(!showFpsCounter); persistSetting('extreamix_show_fps', String(!showFpsCounter)); }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${showFpsCounter ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-surface-container border border-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${showFpsCounter ? 'right-1 bg-black' : 'left-1 bg-outline'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Auto-save Presets</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Automatically save mixer and routing state</span>
                </div>
                <button 
                  onClick={() => { setAutoSavePresets(!autoSavePresets); persistSetting('extreamix_autosave', String(!autoSavePresets)); }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${autoSavePresets ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-surface-container border border-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${autoSavePresets ? 'right-1 bg-black' : 'left-1 bg-outline'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Confirm Before Delete</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Show confirmation dialog before removing items</span>
                </div>
                <button 
                  onClick={() => { setConfirmBeforeDelete(!confirmBeforeDelete); persistSetting('extreamix_confirm_del', String(!confirmBeforeDelete)); }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${confirmBeforeDelete ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.3)]' : 'bg-surface-container border border-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${confirmBeforeDelete ? 'right-1 bg-black' : 'left-1 bg-outline'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Bell className="w-4 h-4 text-tertiary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Notifications</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Email Notifications</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Receive system alerts and updates</span>
                </div>
                <button className="w-10 h-6 bg-primary rounded-full relative transition-colors shadow-[0_0_10px_rgba(var(--color-primary),0.3)]">
                  <span className="absolute right-1 top-1 bottom-1 w-4 bg-black rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Telemetry & Diagnostics</span>
                  <span className="text-[10px] text-outline font-mono mt-1">Help improve Extreamix performance</span>
                </div>
                <button className="w-10 h-6 bg-surface-container rounded-full relative transition-colors border border-white/10">
                  <span className="absolute left-1 top-1 bottom-1 w-4 bg-outline rounded-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Download className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Data Management</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl transition-all font-headline text-[10px] uppercase tracking-widest font-bold"
                >
                  <Download className="w-4 h-4" /> Export Backup
                </button>
                <button 
                  onClick={handleImportData}
                  className="flex items-center gap-2 p-3 bg-surface-container-high hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-headline text-[10px] uppercase tracking-widest font-bold"
                >
                  <Upload className="w-4 h-4" /> Import Backup
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Clear all saved channels, sequencer patterns, and routing configs?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="flex items-center gap-2 p-3 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-xl transition-all font-headline text-[10px] uppercase tracking-widest font-bold"
                >
                  <Trash2 className="w-4 h-4" /> Factory Reset
                </button>
              </div>
              <p className="text-[10px] font-mono text-outline/50 uppercase">Export saves all settings and presets as JSON. Import restores from a backup file. Factory reset clears everything.</p>
            </div>
          </div>

          {/* Sign Out */}
          <div className="flex justify-end pt-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl text-xs font-headline uppercase tracking-widest font-bold transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
