import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Extension from './pages/Extension/Extension';
import Landing from './pages/SaaS/Landing';
import Dashboard from './pages/SaaS/Dashboard';
import RemoteNode from './pages/SaaS/RemoteNode';

function RouterSetup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Detect if running inside a Chrome extension
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    
    // Auto-route based on environment
    if (isExtension && window.location.hash === '') {
      navigate('/');
    } else if (!isExtension && (window.location.hash === '' || window.location.hash === '#/')) {
      // If NOT in extension and trying to access root, redirect to saas
      navigate('/saas');
    }
  }, [navigate]);

  const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

  return (
    <Routes>
      <Route path="/" element={<Extension />} />
      <Route path="/saas" element={<Landing />} />
      <Route path="/saas/dashboard" element={<Dashboard />} />
      <Route path="/saas/remote-node" element={<RemoteNode />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to={isExtension ? "/" : "/saas"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <RouterSetup />
    </HashRouter>
  );
}
