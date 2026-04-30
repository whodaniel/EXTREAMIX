import { useState, useEffect } from 'react';
import { LogOut, User, Key, Bell, Shield, Wallet, Palette, Sparkles, Wand2, PaintBucket } from 'lucide-react';

export const ProfileView = () => {
  const [customBg, setCustomBg] = useState('#0c1324');
  const [customPrimary, setCustomPrimary] = useState('#8ed5ff');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const applyCustomTheme = (bg: string, primary: string) => {
    document.documentElement.setAttribute('data-theme', 'custom');
    document.documentElement.style.setProperty('--custom-bg', bg);
    document.documentElement.style.setProperty('--custom-primary', primary);
  };
  
  const handleAIGenerate = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    
    // Simulate AI thinking and generating a theme
    setTimeout(() => {
      // Pick random-ish but aesthetic colors
      // Let's do a quick random hue generation
      const h = Math.floor(Math.random() * 360);
      const bg = `hsl(${h}, 30%, 10%)`; 
      const pri = `hsl(${(h + 180) % 360}, 80%, 60%)`;
      // We will just generate valid hexs by creating a quick helper, or 
      // just set HSL strings (CSS supports them)
      
      applyCustomTheme(bg, pri);
      setCustomBg(bg); // Just storing string
      setCustomPrimary(pri);
      setIsGenerating(false);
      setAiPrompt('');
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-8 space-y-8 font-sans custom-scrollbar">
      <div className="flex items-center gap-4 text-primary">
        <User className="w-8 h-8" />
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest font-headline">User Profile</h2>
          <p className="text-outline text-xs tracking-wider uppercase font-mono">Account Configuration // Security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden mb-4 relative group">
              <img src="https://picsum.photos/seed/sonicuser/150/150" alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <span className="text-[10px] uppercase font-bold tracking-widest">Change</span>
              </div>
            </div>
            <h3 className="font-headline font-black text-lg tracking-widest uppercase">Admin User</h3>
            <p className="text-outline text-xs font-mono mb-6">admin@extreamix.local</p>
            
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Status</span>
                <span className="text-[10px] text-success uppercase tracking-wider font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Plan</span>
                <span className="text-[10px] text-primary uppercase tracking-wider font-bold">Pro License</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-outline uppercase tracking-wider font-mono">Since</span>
                <span className="text-[10px] text-white uppercase tracking-wider font-bold">2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Key className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Security Configuration</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Display Name</label>
                  <input type="text" defaultValue="Admin User" className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 flex items-center text-xs text-white outline-none focus:border-primary/50 transition-all font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-outline font-mono">Email Address</label>
                  <input type="email" defaultValue="admin@extreamix.local" className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2 flex items-center text-xs text-outline outline-none transition-all font-mono opacity-50 cursor-not-allowed" readOnly />
                </div>
              </div>
              
              <div className="pt-4 mt-6 border-t border-white/5">
                <button className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-headline uppercase tracking-widest font-bold transition-all w-full md:w-auto">
                  Update Password
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Palette className="w-4 h-4 text-tertiary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Interface & Theme</h4>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Presets */}
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

              {/* AI Theme Forge Add-on */}
              <div className="flex flex-col gap-4 p-4 border border-primary/20 rounded-xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                 
                 <div className="flex items-center gap-2 z-10 relative mb-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-black text-white uppercase tracking-widest" style={{ textShadow: '0 0 10px var(--color-primary)' }}>AI Theme Forge</span>
                      <span className="text-[10px] text-primary/80 font-mono tracking-widest uppercase flex items-center gap-2">
                        Add-on unlocked <Wand2 className="w-3 h-3" />
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
                    />
                    <button 
                      onClick={handleAIGenerate}
                      disabled={!aiPrompt || isGenerating}
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

          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Bell className="w-4 h-4 text-tertiary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Preferences</h4>
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
          
          <div className="flex justify-end pt-4">
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
