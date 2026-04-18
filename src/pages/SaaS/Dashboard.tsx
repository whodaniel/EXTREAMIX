import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold text-cyan-400">Dashboard</h1>
        <Link to="/saas" className="text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Home
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Active Streams</h2>
          <p className="text-4xl text-cyan-400">3</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Connected Nodes</h2>
          <p className="text-4xl text-fuchsia-400">12</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <p className="text-xl text-green-400 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block animate-pulse"></span>
            Optimal
          </p>
        </div>
      </div>
    </div>
  );
}
