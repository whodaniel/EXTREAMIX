import React from 'react';
import { Link } from 'react-router-dom';

export default function RemoteNode() {
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-bold text-fuchsia-400">Remote Node Viewer</h1>
          <Link to="/saas" className="text-zinc-400 hover:text-white transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <div className="aspect-video bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="text-center z-10">
            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 text-lg">Waiting for incoming WebRTC stream...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
