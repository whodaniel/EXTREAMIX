import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-cyan-400 mb-4 tracking-tighter">EXTREAMIX</h1>
      <p className="text-xl text-zinc-400 mb-8 max-w-2xl text-center">
        The High-Performance Multimodal Synthesis and Routing Command Center.
        Available as a Chrome Extension and SaaS platform.
      </p>
      <div className="flex gap-4">
        <Link to="/saas/dashboard" className="px-6 py-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors">
          Go to Dashboard
        </Link>
        <Link to="/saas/remote-node" className="px-6 py-3 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors">
          View Remote Node
        </Link>
      </div>
    </div>
  );
}
