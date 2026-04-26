import React from 'react';
import { Radio } from 'lucide-react';

export const BroadcastView = ({ username }: { username: string }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center relative overflow-hidden">
      {/* Live Indicator */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
        <span className="font-mono text-xs tracking-widest uppercase text-red-500">LIVE</span>
      </div>
      
      {/* Brand Watermark */}
      <div className="absolute top-8 right-8 font-headline text-xl text-white/20 uppercase tracking-widest">
        EXTREAMIX
      </div>
      
      <div className="z-10 flex flex-col items-center gap-6 p-4">
        <div className="w-32 h-32 rounded-full border border-primary/30 flex items-center justify-center bg-primary/5">
           <Radio className="w-12 h-12 text-primary" />
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-black uppercase tracking-widest text-white mt-4 text-center break-all">
          {username}'S <span className="text-primary">STREAM</span>
        </h1>
        <p className="font-mono text-sm text-white/50 max-w-md text-center mt-2">
          Awaiting transmission signal...
        </p>
      </div>
      
      {/* Simulated Audio/Video Waveform Activity */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
         <div className="h-full bg-primary animate-pulse" style={{ width: '30%', marginLeft: '10%' }} />
      </div>
    </div>
  );
};
