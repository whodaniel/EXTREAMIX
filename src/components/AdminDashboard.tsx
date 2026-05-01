import React, { useState, useEffect } from 'react';
import { 
  Lock, ShieldAlert, CheckCircle, Trash2, Plus, RefreshCw, Server, 
  Users, BarChart3, Globe, Activity, Settings, ToggleLeft, ToggleRight,
  Cloud, Database, Shield, Eye, EyeOff, Cpu, HardDrive, Radio, Flag,
  AlertTriangle, Search, Download, Upload, Zap
} from 'lucide-react';

interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
  prio?: string;
  notes?: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  rolloutPct: number;
}

interface UserRecord {
  id: string;
  email: string;
  plan: string;
  created: string;
  lastActive: string;
  entitlements: string[];
}

interface DeploymentInfo {
  service: string;
  region: string;
  url: string;
  lastDeploy: string;
  status: 'healthy' | 'degraded' | 'down';
  revisions: number;
}

export const AdminDashboard = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domain, setDomain] = useState('extreamix.com');
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dns' | 'users' | 'analytics' | 'deploy' | 'flags' | 'webhooks'>('dns');

  // New record form state
  const [newRecord, setNewRecord] = useState({
    name: '',
    type: 'A',
    content: '',
    ttl: '600'
  });

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: '1', name: 'AI Filter Forge', key: 'ai_filter_forge', enabled: true, description: 'Allow AI-generated video filters', rolloutPct: 100 },
    { id: '2', name: 'AI Synth Scaffolder', key: 'ai_synth_scaffolder', enabled: true, description: 'AI-generated synth patches', rolloutPct: 100 },
    { id: '3', name: 'Spatial Audio', key: 'spatial_audio', enabled: true, description: '3D spatial audio engine', rolloutPct: 100 },
    { id: '4', name: 'AI Theme Forge', key: 'ai_theme_forge', enabled: true, description: 'AI-generated UI themes', rolloutPct: 100 },
    { id: '5', name: 'Ad Banner (Free)', key: 'ad_banner_free', enabled: true, description: 'Show ads to free-tier users', rolloutPct: 100 },
    { id: '6', name: 'WebRTC Streaming', key: 'webrtc_streaming', enabled: false, description: 'Live P2P streaming (beta)', rolloutPct: 10 },
    { id: '7', name: 'Collab Sessions', key: 'collab_sessions', enabled: false, description: 'Multi-user collaboration rooms', rolloutPct: 0 },
  ]);

  // Deployment info
  const [deployments] = useState<DeploymentInfo[]>([
    { service: 'Cloud Run API', region: 'us-west1', url: 'https://extreamix-72824833271.us-west1.run.app', lastDeploy: '2025-05-01T05:24:00Z', status: 'healthy', revisions: 14 },
    { service: 'Cloudflare Pages', region: 'Global Edge', url: 'https://extreamix.com', lastDeploy: '2025-05-01T05:24:00Z', status: 'healthy', revisions: 14 },
    { service: 'Supabase DB', region: 'us-west1', url: 'supabase.co', lastDeploy: 'Provisioned', status: 'healthy', revisions: 1 },
  ]);

  // Mock user data
  const [userSearch, setUserSearch] = useState('');
  const [users] = useState<UserRecord[]>([
    { id: 'usr_001', email: 'admin@extreamix.com', plan: 'Broadcast', created: '2024-11-15', lastActive: '2025-05-01', entitlements: ['Extreamix Pro', 'ai_filter_forge', 'ai_theme_forge'] },
    { id: 'usr_002', email: 'beta@test.com', plan: 'Studio', created: '2025-01-20', lastActive: '2025-04-30', entitlements: ['Extreamix Pro'] },
    { id: 'usr_003', email: 'free@test.com', plan: 'Pulse (Free)', created: '2025-03-10', lastActive: '2025-04-28', entitlements: [] },
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setIsAuthenticated(true);
      fetchRecords(password);
    }
  };

  const fetchRecords = async (authPass: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/dns/${domain}/records`, {
        headers: {
          'x-admin-password': authPass
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch records');
      }

      if (data.status === 'SUCCESS') {
        setRecords(data.records || []);
      }
    } catch (err: any) {
      setError(err.message);
      if (err.message === 'Unauthorized access') {
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/dns/${domain}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(newRecord)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create record');
      }
      
      setNewRecord({ name: '', type: 'A', content: '', ttl: '600' });
      await fetchRecords(password);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this DNS record?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/dns/${domain}/records/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete record');
      }
      
      await fetchRecords(password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureFlag = (id: string) => {
    setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-sm border border-red-500/30 bg-black p-8 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 pulse-opacity pointer-events-none"></div>
          <div className="flex items-center gap-4 text-red-500 mb-6">
            <Lock className="w-8 h-8" />
            <h2 className="font-headline text-xl uppercase tracking-widest font-black">Restricted Area</h2>
          </div>
          <p className="text-sm font-mono text-white/50 mb-6">
            Enter admin authorization key to access exclusive management interfaces.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full bg-black border border-white/20 text-white p-3 font-mono text-sm focus:border-red-500 focus:outline-none transition-colors"
              required
            />
            <button 
              type="submit"
              className="w-full uppercase font-headline font-black text-xs tracking-widest py-3 bg-red-500 hover:bg-red-400 text-black transition-colors"
            >
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dns' as const, label: 'DNS', icon: Globe },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'deploy' as const, label: 'Deploy', icon: Cloud },
    { id: 'flags' as const, label: 'Feature Flags', icon: Flag },
    { id: 'webhooks' as const, label: 'Webhooks', icon: Radio },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-8 space-y-6 font-sans custom-scrollbar">
      <div className="flex items-center gap-4 text-primary">
        <Server className="w-8 h-8" />
        <div>
          <h2 className="font-headline text-2xl md:text-4xl uppercase tracking-widest font-black">Admin Command</h2>
          <p className="text-outline text-xs tracking-wider uppercase font-mono">Infrastructure // Users // Feature Control</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-500 font-mono text-sm flex items-start gap-3 rounded">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-container-high/60 rounded-xl border border-white/5 p-1 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-headline text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'text-outline hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- DNS Management Tab --- */}
      {activeTab === 'dns' && (
        <section className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]">
          <div className="border-b border-white/10 p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#111]">
            <div>
              <h3 className="font-headline text-lg text-white uppercase tracking-wider mb-1">DNS Management</h3>
              <p className="text-xs font-mono text-white/50">Porkbun DNS records for {domain}</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="text" 
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-black border border-white/20 text-white px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none w-full md:w-48"
                placeholder="Domain Name"
              />
              <button 
                onClick={() => fetchRecords(password)}
                disabled={loading}
                className="p-2 border border-white/20 hover:bg-white/10 text-white transition-colors"
                title="Refresh Records"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin opacity-50' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-white/10 bg-black/50">
            <h4 className="font-headline text-xs text-primary uppercase tracking-widest mb-4">Add New Record</h4>
            <form onSubmit={handleCreateRecord} className="flex flex-col md:flex-row gap-3 items-end">
              <div className="space-y-1 w-full md:w-auto flex-1">
                <label className="text-[10px] font-mono text-white/50 uppercase">Type</label>
                <select 
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                  className="w-full bg-black border border-white/20 text-white p-2 font-mono text-sm focus:border-primary focus:outline-none"
                >
                  {['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'ALIAS'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 w-full md:w-auto flex-[2]">
                <label className="text-[10px] font-mono text-white/50 uppercase">Host / Name</label>
                <input 
                  type="text" 
                  value={newRecord.name}
                  onChange={(e) => setNewRecord({...newRecord, name: e.target.value})}
                  placeholder="e.g. www (leave blank for root)"
                  className="w-full bg-black border border-white/20 text-white p-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1 w-full md:w-auto flex-[3]">
                <label className="text-[10px] font-mono text-white/50 uppercase">Answer / Content</label>
                <input 
                  type="text" 
                  value={newRecord.content}
                  onChange={(e) => setNewRecord({...newRecord, content: e.target.value})}
                  required
                  placeholder="192.168.1.1"
                  className="w-full bg-black border border-white/20 text-white p-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1 w-full md:w-auto flex-1">
                <label className="text-[10px] font-mono text-white/50 uppercase">TTL</label>
                <input 
                  type="text" 
                  value={newRecord.ttl}
                  onChange={(e) => setNewRecord({...newRecord, ttl: e.target.value})}
                  className="w-full bg-black border border-white/20 text-white p-2 font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-primary hover:bg-white text-black font-headline text-xs uppercase tracking-widest font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
          </div>

          <div className="p-0 overflow-x-auto">
            {records.length > 0 ? (
              <table className="w-full text-left font-mono text-sm whitespace-nowrap">
                <thead className="bg-[#111] text-white/50 text-xs border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-4 font-normal">Type</th>
                    <th className="p-4 font-normal">Name</th>
                    <th className="p-4 font-normal">Content</th>
                    <th className="p-4 font-normal">TTL</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-primary">{record.type}</td>
                      <td className="p-4 text-white">{record.name}</td>
                      <td className="p-4 text-white/70 max-w-xs truncate" title={record.content}>{record.content}</td>
                      <td className="p-4 text-white/50">{record.ttl}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={loading}
                          className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-white/30 font-mono text-sm">
                {loading ? 'LOADING RECORDS...' : 'NO RECORDS FOUND OR AWAITING FETCH'}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- Users Tab --- */}
      {activeTab === 'users' && (
        <section className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]">
          <div className="border-b border-white/10 p-6 bg-[#111]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-headline text-lg text-white uppercase tracking-wider mb-1">User Management</h3>
                <p className="text-xs font-mono text-white/50">Search, inspect, and manage user accounts</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="text" 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email or ID..."
                    className="w-full bg-black border border-white/20 text-white pl-9 pr-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button className="p-2 border border-white/20 hover:bg-white/10 text-white transition-colors" title="Export Users">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left font-mono text-sm whitespace-nowrap">
              <thead className="bg-[#111] text-white/50 text-xs border-b border-white/10 uppercase">
                <tr>
                  <th className="p-4 font-normal">User ID</th>
                  <th className="p-4 font-normal">Email</th>
                  <th className="p-4 font-normal">Plan</th>
                  <th className="p-4 font-normal">Entitlements</th>
                  <th className="p-4 font-normal">Last Active</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users
                  .filter(u => !userSearch || u.email.includes(userSearch) || u.id.includes(userSearch))
                  .map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 text-primary font-mono text-xs">{user.id}</td>
                    <td className="p-4 text-white">{user.email}</td>
                    <td className="p-4">
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                        user.plan === 'Broadcast' ? 'bg-tertiary/20 text-tertiary' :
                        user.plan === 'Studio' ? 'bg-primary/20 text-primary' :
                        'bg-white/10 text-outline'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="p-4 text-white/50 text-xs max-w-[200px] truncate">{user.entitlements.length > 0 ? user.entitlements.join(', ') : 'none'}</td>
                    <td className="p-4 text-white/50">{user.lastActive}</td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-white/40 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-white/5 bg-[#111] flex items-center justify-between">
            <span className="text-[10px] text-white/30 font-mono uppercase">{users.length} users total</span>
            <div className="flex gap-4 text-[10px] text-white/50 font-mono">
              <span>Pulse: {users.filter(u => u.plan === 'Pulse (Free)').length}</span>
              <span>Studio: {users.filter(u => u.plan === 'Studio').length}</span>
              <span>Broadcast: {users.filter(u => u.plan === 'Broadcast').length}</span>
            </div>
          </div>
        </section>
      )}

      {/* --- Analytics Tab --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: '847', change: '+12%', icon: Users, color: 'text-primary' },
              { label: 'Active Subscribers', value: '156', change: '+8%', icon: Zap, color: 'text-tertiary' },
              { label: 'Monthly Revenue', value: '$2,340', change: '+23%', icon: BarChart3, color: 'text-primary' },
              { label: 'Conversion Rate', value: '18.4%', change: '+1.2%', icon: Activity, color: 'text-tertiary' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-container-low border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color} opacity-60`} />
                  <span className="text-[9px] font-headline text-tertiary uppercase tracking-widest font-bold">{stat.change}</span>
                </div>
                <div className="text-2xl font-black text-white font-headline tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-outline font-mono uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue by Tier */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
            <h3 className="font-headline text-sm text-white uppercase tracking-widest font-bold mb-4">Revenue by Tier</h3>
            <div className="space-y-3">
              {[
                { tier: 'Studio (Monthly)', revenue: 890, pct: 38, color: 'bg-primary' },
                { tier: 'Broadcast (Annual)', revenue: 1200, pct: 51, color: 'bg-tertiary' },
                { tier: 'Add-on Purchases', revenue: 250, pct: 11, color: 'bg-white/30' },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-white">{row.tier}</span>
                    <span className="text-white/70">${row.revenue}/mo</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add-on Adoption */}
          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
            <h3 className="font-headline text-sm text-white uppercase tracking-widest font-bold mb-4">Add-on Adoption</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'AI Filter Forge', adopters: 42, color: 'text-primary' },
                { name: 'Synth Scaffolder', adopters: 18, color: 'text-tertiary' },
                { name: 'Spatial Audio', adopters: 8, color: 'text-primary' },
                { name: 'AI Theme Forge', adopters: 31, color: 'text-tertiary' },
              ].map((addon, i) => (
                <div key={i} className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
                  <div className={`text-xl font-black ${addon.color} font-headline`}>{addon.adopters}</div>
                  <div className="text-[9px] text-outline font-mono uppercase tracking-wider mt-1">{addon.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs text-outline font-mono">Analytics data is illustrative. Connect Supabase or a real analytics backend to populate live metrics.</p>
          </div>
        </div>
      )}

      {/* --- Deployment Tab --- */}
      {activeTab === 'deploy' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Cloud className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Infrastructure Status</h4>
            </div>
            <div className="divide-y divide-white/5">
              {deployments.map((dep, i) => (
                <div key={i} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      dep.status === 'healthy' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                      dep.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="text-white text-sm font-headline font-bold uppercase tracking-wider">{dep.service}</div>
                      <div className="text-[10px] text-outline font-mono">{dep.region}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] text-outline font-mono">
                      <span className="text-white/70">Rev:</span> {dep.revisions}
                    </div>
                    <a href={dep.url.startsWith('http') ? dep.url : `https://${dep.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary font-mono hover:underline">
                      {dep.url}
                    </a>
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                      dep.status === 'healthy' ? 'bg-green-500/10 text-green-400' :
                      dep.status === 'degraded' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {dep.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 space-y-4">
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white flex items-center gap-3">
              <Database className="w-4 h-4 text-primary" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl px-4 py-3 font-headline text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" /> Redeploy Latest
              </button>
              <button className="bg-surface-container-high hover:bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 font-headline text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Flush CDN Cache
              </button>
              <button className="bg-surface-container-high hover:bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 font-headline text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Database Backup
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white mb-3 flex items-center gap-3">
              <Cpu className="w-4 h-4 text-primary" />
              Environment Variables
            </h4>
            <div className="space-y-2 font-mono text-xs">
              {[
                { key: 'VITE_REVENUECAT_PUBLIC_KEY', set: true },
                { key: 'REVENUECAT_WEBHOOK_AUTH', set: true },
                { key: 'ADMIN_PASSWORD', set: true },
                { key: 'PORKBUN_API_KEY', set: false },
                { key: 'PORKBUN_SECRET_KEY', set: false },
                { key: 'VITE_ADMIN_USER_ID', set: false },
              ].map((env, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/5">
                  <span className="text-white/70">{env.key}</span>
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${env.set ? 'text-green-400' : 'text-red-400'}`}>
                    {env.set ? 'SET' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Feature Flags Tab --- */}
      {activeTab === 'flags' && (
        <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
          <div className="border-b border-white/5 p-4 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flag className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Feature Flags</h4>
            </div>
            <button className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg font-headline text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-all">
              <Plus className="w-3 h-3" /> New Flag
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {featureFlags.map(flag => (
              <div key={flag.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleFeatureFlag(flag.id)}
                    className={`p-1.5 rounded-lg transition-colors ${flag.enabled ? 'text-primary bg-primary/10' : 'text-white/20 bg-white/5'}`}
                    title={flag.enabled ? 'Disable' : 'Enable'}
                  >
                    {flag.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-headline font-bold uppercase tracking-wider">{flag.name}</span>
                      <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                        flag.enabled ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-outline'
                      }`}>
                        {flag.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <div className="text-[10px] text-outline font-mono mt-0.5">{flag.description}</div>
                    <div className="text-[9px] text-white/30 font-mono mt-0.5">key: {flag.key}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm font-black text-white font-headline">{flag.rolloutPct}%</div>
                    <div className="text-[8px] text-outline font-mono uppercase">Rollout</div>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" step="5" 
                    value={flag.rolloutPct}
                    onChange={(e) => setFeatureFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rolloutPct: parseInt(e.target.value) } : f))}
                    className="w-20 h-1 bg-surface-container-highest appearance-none rounded-full accent-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Webhooks Tab --- */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 bg-black/20 flex items-center gap-3">
              <Radio className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-bold text-xs uppercase tracking-widest">Webhook Endpoints</h4>
            </div>
            <div className="divide-y divide-white/5">
              <div className="p-5 flex items-center justify-between hover:bg-white/[0.02]">
                <div>
                  <div className="text-white text-sm font-headline font-bold uppercase tracking-wider">RevenueCat</div>
                  <div className="text-[10px] text-outline font-mono mt-0.5">POST /api/webhooks/revenuecat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-widest font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded">ACTIVE</span>
                  <button className="text-[9px] text-primary font-mono hover:underline">Test</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6">
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white mb-3">Recent Webhook Events</h4>
            <div className="space-y-2 font-mono text-xs">
              {[
                { event: 'INITIAL_PURCHASE', user: 'usr_002', time: '2 hours ago', status: '200' },
                { event: 'RENEWAL', user: 'usr_001', time: '1 day ago', status: '200' },
                { event: 'CANCELLATION', user: 'usr_003', time: '3 days ago', status: '200' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-primary">{log.event}</span>
                    <span className="text-white/50">{log.user}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30">{log.time}</span>
                    <span className="text-green-400">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low border border-white/5 rounded-2xl p-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs text-outline font-mono">Webhook delivery log is in-memory and resets on deploy. Connect a persistent store (Supabase, Cloud Logging) for production audit trails.</p>
          </div>
        </div>
      )}
    </div>
  );
};
