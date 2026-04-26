import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, CheckCircle, Trash2, Plus, RefreshCw, Server } from 'lucide-react';

interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: string;
  prio?: string;
  notes?: string;
}

export const AdminDashboard = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domain, setDomain] = useState('extreamix.com'); // Default from prompt
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New record form state
  const [newRecord, setNewRecord] = useState({
    name: '',
    type: 'A',
    content: '',
    ttl: '600'
  });

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
      
      // Reset form on success and refresh records
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

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-8 space-y-8 font-sans">
      <div className="flex items-center gap-4 text-primary">
        <Server className="w-8 h-8" />
        <h2 className="font-headline text-2xl md:text-4xl uppercase tracking-widest font-black">Admin Management</h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-500 font-mono text-sm flex items-start gap-3 rounded">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* DNS Management Section */}
      <section className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a]">
        <div className="border-b border-white/10 p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#111]">
          <div>
            <h3 className="font-headline text-lg text-white uppercase tracking-wider mb-1">DNS Management</h3>
            <p className="text-xs font-mono text-white/50">Manage Porkbun DNS records for {domain}</p>
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

        {/* Create Record Form */}
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

        {/* Records List */}
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

    </div>
  );
};
