import React from 'react';

export const AdBanner = () => {
  return (
    <div className="w-full bg-[#0a0a0a] border-t border-white/10 p-2 flex justify-center items-center relative z-40 h-16 shrink-0">
      <div className="w-full max-w-3xl h-full border border-white/5 bg-black flex items-center justify-between px-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] pointer-events-none"></div>
        <div className="flex flex-col">
          <span className="font-mono text-[8px] text-white/30 uppercase tracking-widest">Advertisement</span>
          <span className="font-headline text-sm font-black text-white/50 uppercase tracking-wider group-hover:text-primary transition-colors">
            Support EXTREAMIX Development
          </span>
        </div>
        <div className="font-mono text-xs pl-4 text-white/40 border-l border-white/10">
          <span className="hidden leading-tight md:inline">Upgrade for $2.99 to remove ads <br/> and unlock full performance.</span>
          <span className="md:hidden">Upgrade to remove</span>
        </div>
      </div>
    </div>
  );
};
