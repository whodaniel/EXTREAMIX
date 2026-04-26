import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Clock, Crosshair, Check, ChevronRight, Activity } from 'lucide-react';

export const LandingPage = ({ 
  onInitiate, 
  packages = [], 
  isPro = false, 
  onPurchase,
  isPurchasing = false 
}: { 
  onInitiate: () => void;
  packages?: any[];
  isPro?: boolean;
  onPurchase?: (pkg: any) => void;
  isPurchasing?: boolean;
}) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Background Pulse Simulation (120BPM = 500ms intervals) */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="grid grid-cols-3 gap-0.5 md:gap-2 w-full h-full max-w-7xl mx-auto p-4 opacity-20">
          {[
            { color: 'bg-error', blur: 'shadow-error' },
            { color: 'bg-tertiary', blur: 'shadow-tertiary' },
            { color: 'bg-primary', blur: 'shadow-primary' }
          ].map((gate, i) => (
            <motion.div
              key={i}
              className={`w-full h-full ${gate.color} blur-[120px]`}
              animate={{ 
                opacity: [0.1, 0.8, 0.1],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.5, 
                delay: i * 0.1, // Slight offset for matrix feel
                ease: "easeInOut" 
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9zdmc+')] z-10" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Navigation / Header */}
        <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 bg-primary animate-pulse" />
             <span className="font-headline text-xl font-black tracking-[0.3em] uppercase glow-text">EXTREAMIX</span>
          </div>
          <div className="font-mono text-[10px] text-outline/50 uppercase tracking-widest hidden sm:block">
            V 4.0.0 // BROWSER_NATIVE
          </div>
        </nav>

        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-40 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 rounded-full bg-primary/10 text-primary font-mono text-[10px] uppercase tracking-widest mb-12">
              <Activity className="w-3 h-3" />
              <span>System Online // Audio Matrix Ready</span>
            </div>

            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
              <span className="block text-white">Zero Latency.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-primary animate-gradient-x">Total Orchestration.</span>
            </h1>
            
            <p className="max-w-2xl text-base md:text-xl text-outline font-body leading-relaxed mb-12">
              Break out of the cloud sandbox. EXTREAMIX is a browser-native studio engineered for the next era of high-fidelity audio-visual synthesis.
            </p>

            <button 
              onClick={onInitiate}
              className="group relative inline-flex items-center justify-center px-10 py-5 bg-primary text-black font-headline text-sm md:text-base font-black tracking-[0.2em] uppercase overflow-hidden rounded-sm transition-transform active:scale-95"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-3">
                [INITIATE_ENGINE_v4]
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <div className="mt-6 font-mono text-[10px] text-outline/40 uppercase tracking-widest">
              CAUTION: HIGH FREQUENCY AUDIO OUTPUT
            </div>
          </motion.div>
        </section>

        {/* Core Pillars */}
        <section className="w-full bg-surface-container-highest/20 border-y border-white/5 py-24 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: Crosshair,
                title: "Tactile Precision",
                desc: "Map your physical hardware directly to the WebGL shader pipeline with our Dynamic MIDI Learn system."
              },
              {
                icon: Clock,
                title: "The Pulse Clock",
                desc: "A 16-step lookahead scheduler hitting 48kHz precision. No drift. No jitter. Just raw timing."
              },
              {
                icon: Shield,
                title: "Sentinel Guarded",
                desc: "Your codebase is protected by the AgentGuard framework. Security isn't an overlay; it's the foundation."
              }
            ].map((pillar, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-surface border border-white/10 rounded-xl flex items-center justify-center mb-6">
                  <pillar.icon className="w-6 h-6 text-tertiary" />
                </div>
                <h3 className="font-headline text-xl font-black uppercase tracking-wider mb-4 border-b border-primary/30 pb-4 inline-block">{pillar.title}</h3>
                <p className="text-outline leading-relaxed font-body text-sm">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Experience Tiers */}
        <section className="w-full max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="font-headline text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Hardware Tiers</h2>
            <p className="text-outline font-mono text-xs tracking-widest uppercase">Select your operational bandwidth</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PULSE Tier */}
            <div className="bg-surface-container-low border border-white/5 p-8 flex flex-col relative group hover:border-white/20 transition-colors">
              <div className="mb-8">
                <div className="font-mono text-[10px] text-outline/50 uppercase tracking-widest mb-2">The Core Loop</div>
                <h3 className="font-headline text-2xl font-black uppercase tracking-widest text-white mb-4">[PULSE]</h3>
                <div className="font-headline text-4xl font-black">$0 <span className="text-sm text-outline font-normal">/ FOREVER</span></div>
              </div>
              <ul className="space-y-4 mb-12 flex-1 font-mono text-xs text-outline">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> Web Audio Matrix</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> 16-Step Sequencer</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> Live Spectral Analysis</li>
              </ul>
              <button onClick={onInitiate} className="w-full py-4 border border-white/20 hover:bg-white/10 text-white font-headline text-xs uppercase tracking-widest transition-colors font-black">
                ENGAGE
              </button>
            </div>

            {/* STUDIO Tier */}
            <div className="bg-surface-container-high border-2 border-primary p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(56,189,248,0.1)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black font-headline text-[9px] uppercase tracking-widest px-4 py-1 font-black">
                RECOMMENDED
              </div>
              <div className="mb-8">
                <div className="font-mono text-[10px] text-primary/80 uppercase tracking-widest mb-2">The Professional Rig</div>
                <h3 className="font-headline text-2xl font-black uppercase tracking-widest text-primary mb-4">[STUDIO]</h3>
                {packages.find(p => p.identifier === 'Monthly' || p.identifier === '$rc_monthly') ? (
                  <div className="font-headline text-4xl font-black text-white">
                    {packages.find(p => p.identifier === 'Monthly' || p.identifier === '$rc_monthly').product.priceString}
                    <span className="text-sm text-outline font-normal"> / MO</span>
                  </div>
                ) : (
                  <div className="font-headline text-4xl font-black text-white">$15 <span className="text-sm text-outline font-normal">/ MO</span></div>
                )}
              </div>
              <ul className="space-y-4 mb-12 flex-1 font-mono text-xs text-outline">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> <span className="text-white">Everything in Pulse</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> High-Fidelity WebM Capture</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> Dynamic MIDI Mapping</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-primary shrink-0" /> Unlimited Registry Patches</li>
              </ul>
              {isPro ? (
                 <button onClick={onInitiate} className="w-full py-4 bg-primary hover:bg-white text-black font-headline text-xs uppercase tracking-widest transition-colors font-black">
                    ACCESS GRANTED // ENGAGE
                 </button>
              ) : (
                <button 
                  onClick={() => {
                    const monthlyPkg = packages.find(p => p.identifier === 'Monthly' || p.identifier === '$rc_monthly');
                    if (monthlyPkg && onPurchase) {
                      onPurchase(monthlyPkg);
                    } else {
                      onInitiate();
                    }
                  }}
                  disabled={isPurchasing}
                  className="w-full py-4 bg-primary hover:bg-white text-black font-headline text-xs uppercase tracking-widest transition-colors font-black disabled:opacity-50"
                 >
                  {isPurchasing ? 'PROCESSING...' : 'UPGRADE TO STUDIO'}
                 </button>
              )}
            </div>

            {/* BROADCAST Tier */}
            <div className="bg-surface-container-low border border-white/5 p-8 flex flex-col relative group hover:border-white/20 transition-colors">
              <div className="mb-8">
                <div className="font-mono text-[10px] text-tertiary/80 uppercase tracking-widest mb-2">The Global Bridge</div>
                <h3 className="font-headline text-2xl font-black uppercase tracking-widest text-tertiary mb-4">[BROADCAST]</h3>
                {packages.find(p => p.identifier === 'Annual' || p.identifier === '$rc_annual') ? (
                  <div className="font-headline text-4xl font-black text-white">
                    {packages.find(p => p.identifier === 'Annual' || p.identifier === '$rc_annual').product.priceString}
                    <span className="text-sm text-outline font-normal"> / YR</span>
                  </div>
                ) : (
                  <div className="font-headline text-4xl font-black text-white">$49 <span className="text-sm text-outline font-normal">/ MO</span></div>
                )}
              </div>
              <ul className="space-y-4 mb-12 flex-1 font-mono text-xs text-outline">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-tertiary shrink-0" /> <span className="text-white">Everything in Studio</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-tertiary shrink-0" /> Cloud-Canvas Mixing</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-tertiary shrink-0" /> Multi-Stream RTMP Output</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-tertiary shrink-0" /> URL Media Injection</li>
              </ul>
              {isPro ? (
                 <button onClick={onInitiate} className="w-full py-4 border border-tertiary/40 hover:bg-tertiary/10 text-tertiary font-headline text-xs uppercase tracking-widest transition-colors font-black">
                    ACCESS GRANTED
                 </button>
              ) : (
                <button 
                  onClick={() => {
                    const annualPkg = packages.find(p => p.identifier === 'Annual' || p.identifier === '$rc_annual');
                    if (annualPkg && onPurchase) {
                      onPurchase(annualPkg);
                    } else {
                      onInitiate(); // Fallback
                    }
                  }}
                  disabled={isPurchasing}
                  className="w-full py-4 border border-tertiary/40 hover:bg-tertiary/10 text-tertiary font-headline text-xs uppercase tracking-widest transition-colors font-black disabled:opacity-50"
                 >
                  {isPurchasing ? 'PROCESSING...' : 'GET ANNUAL ACCESS'}
                 </button>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/5 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="font-mono text-[10px] text-outline/40 uppercase tracking-widest">
               © {new Date().getFullYear()} EXTREAMIX. All signals reserved.
             </div>
             <div className="flex gap-6 font-mono text-[10px] text-outline/60 uppercase tracking-widest">
               <a href="#" className="hover:text-primary transition-colors">Documentation</a>
               <a href="#" className="hover:text-primary transition-colors">API Reference</a>
               <a href="#" className="hover:text-primary transition-colors">Status: ONLINE</a>
             </div>
          </div>
        </footer>

      </div>
    </div>
  );
};
