"use client";

import React, { useEffect, useState } from 'react';

interface Container {
  [key: string]: any;
}
interface HostResult {
  host: string;
  containers: Container[];
  error?: boolean;
}

export default function DockerStatusWidget() {
  const [hosts, setHosts] = useState<HostResult[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [restarting, setRestarting] = useState<string | null>(null);

  const fetchStatus = () => {
    setLoading(true);
    fetch('/api/docker/status')
      .then(res => res.json())
      .then(res => {
        setHosts(res.hosts || []);
        setLoading(false);
        if (res.hosts && res.hosts.length > 0 && !selected) {
          setSelected(res.hosts[0].host);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, []);

  const handleRestart = async (name: string) => {
    setRestarting(name);
    await fetch('/api/docker/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setRestarting(null);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {[1,2].map(i => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-gray-200" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">Failed to load Docker status.</div>;
  }

  const selectedHost = hosts.find(h => h.host === selected);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="mb-2">
        <label className="text-xs text-gray-500 mr-2">Host:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {hosts.map(h => (
            <option key={h.host} value={h.host}>{h.host}</option>
          ))}
        </select>
      </div>
      {selectedHost?.error && (
        <div className="text-red-500">Error fetching containers for {selectedHost.host}</div>
      )}
      {selectedHost && selectedHost.containers.length === 0 && !selectedHost.error && (
        <div className="text-gray-400">No containers running.</div>
      )}
      {selectedHost && selectedHost.containers.map(c => (
        <div key={c.ID || c.Names} className="flex items-center gap-3 bg-gray-50 rounded p-2">
          <div className={`h-4 w-4 rounded-full ${c.Status && c.Status.includes('Up') ? 'bg-green-500' : 'bg-red-500'}`} title={c.Status} />
          <div className="font-mono text-sm truncate" title={c.Names}>{c.Names || c.ID}</div>
          <div className="text-xs text-gray-500 ml-2">{c.Status}</div>
          <button
            className="ml-auto px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
            onClick={() => handleRestart(c.Names || c.ID)}
            disabled={!!restarting}
          >
            {restarting === (c.Names || c.ID) ? 'Restarting...' : 'Restart'}
          </button>
        </div>
      ))}
    </div>
  );
} 