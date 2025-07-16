"use client";

import React, { useEffect, useState } from 'react';
import ServerMetricsChart from './ServerMetricsChart';

interface Server {
  name: string;
  load?: number[];
  mem?: { total: number; used: number; free: number };
  disk?: { source: string; size: string; used: string; avail: string; pcent: string; target: string }[];
  error?: boolean;
  tags?: string[];
}

function usageColor(val: number, warn: number, crit: number) {
  if (val >= crit) return 'bg-red-500';
  if (val >= warn) return 'bg-yellow-400';
  return 'bg-green-500';
}

function getAlerts(server: Server) {
  const alerts: string[] = [];
  if (server.error) alerts.push('Server unreachable or SSH error');
  if (server.load && server.load[0] > 1.5) alerts.push(`High CPU load: ${server.load[0]}`);
  if (server.mem && server.mem.total > 0 && server.mem.used / server.mem.total > 0.8) alerts.push(`High memory usage: ${server.mem.used} / ${server.mem.total} MB`);
  if (server.disk && server.disk.length > 0) {
    const diskPct = parseInt(server.disk[0].pcent, 10) / 100;
    if (diskPct > 0.8) alerts.push(`High disk usage: ${server.disk[0].used} / ${server.disk[0].size} (${server.disk[0].pcent})`);
  }
  return alerts;
}

export default function ServerHealthWidget() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [script, setScript] = useState('');

  const fetchHealth = (name?: string) => {
    setLoading(true);
    fetch(`/api/servers/health${name ? `?server=${encodeURIComponent(name)}` : ''}`)
      .then(res => res.json())
      .then(res => {
        setServers(res.servers || []);
        setLoading(false);
        if (res.servers && res.servers.length > 0 && !selected) {
          setSelected(res.servers[0].name);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selected) fetchHealth(selected);
    // eslint-disable-next-line
  }, [selected]);

  const handleAction = async (action: 'restart' | 'script', scriptText?: string) => {
    setActionLoading(true);
    setActionResult(null);
    const res = await fetch('/api/servers/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: selected, action, script: scriptText }),
    });
    const data = await res.json();
    setActionLoading(false);
    setActionResult(data.status === 'ok' ? (data.output || 'Success') : (data.error || 'Error'));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {[1,2].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-20 rounded" />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">Failed to load server health.</div>;
  }

  const selectedServer = servers.find(s => s.name === selected);

  // Group servers by tag
  const tagGroups: { [tag: string]: Server[] } = {};
  servers.forEach(s => {
    (s.tags || ["untagged"]).forEach(tag => {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(s);
    });
  });
  const sortedTags = Object.keys(tagGroups).sort();

  const alerts = selectedServer ? getAlerts(selectedServer) : [];

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="mb-2">
        <label className="text-xs text-gray-500 mr-2">Server:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {sortedTags.map(tag => (
            <optgroup key={tag} label={tag}>
              {tagGroups[tag].map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.tags && s.tags.length > 0 ? `(${s.tags.join(", ")})` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {alerts.length > 0 && (
        <div className="mb-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          <div className="font-bold flex items-center gap-2">
            <span>⚠️</span> Alerts:
          </div>
          <ul className="ml-4 list-disc text-xs">
            {alerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      {selectedServer?.error ? (
        <div className="text-red-500 text-sm">Error fetching data</div>
      ) : selectedServer ? (
        <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
          <div className="font-semibold text-gray-700 mb-1">{selectedServer.name}</div>
          <div className="flex flex-col gap-1">
            {/* CPU Load */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">CPU</span>
              <div className={`h-3 w-3 rounded-full ${usageColor((selectedServer.load?.[0] ?? 0), 1, 2)}`} title={`Load: ${selectedServer.load?.join(', ')}`}></div>
              <span className="text-xs">{selectedServer.load?.[0] ?? '-'} (1m)</span>
            </div>
            {/* Memory */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Memory</span>
              <div className={`h-3 w-3 rounded-full ${usageColor(Number(selectedServer.mem && selectedServer.mem.used / (selectedServer.mem.total || 1)) || 0, 0.7, 0.9)}`}></div>
              <span className="text-xs">{selectedServer.mem ? `${selectedServer.mem.used} / ${selectedServer.mem.total} MB` : '-'}</span>
            </div>
            {/* Disk */}
            {selectedServer.disk && selectedServer.disk.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Disk</span>
                <div className={`h-3 w-3 rounded-full ${usageColor(Number(parseInt(selectedServer.disk[0].pcent, 10)) / 100 || 0, 0.7, 0.9)}`}></div>
                <span className="text-xs">{selectedServer.disk[0].used} / {selectedServer.disk[0].size} ({selectedServer.disk[0].pcent})</span>
              </div>
            )}
          </div>
          {/* Server Actions */}
          <div className="mt-4 flex gap-2 items-center">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs disabled:bg-gray-300"
              onClick={() => handleAction('restart')}
              disabled={actionLoading}
            >
              Restart
            </button>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs disabled:bg-gray-300"
              onClick={() => setShowScript(true)}
              disabled={actionLoading}
            >
              Run Script
            </button>
            {actionLoading && <span className="text-xs text-gray-400 ml-2">Running...</span>}
            {actionResult && <span className="text-xs text-green-600 ml-2">{actionResult}</span>}
          </div>
          {showScript && (
            <div className="mt-2 flex flex-col gap-2 bg-gray-50 p-2 rounded">
              <textarea
                className="border rounded px-2 py-1 text-xs font-mono"
                rows={2}
                placeholder="Enter shell command/script to run..."
                value={script}
                onChange={e => setScript(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs disabled:bg-gray-300"
                  onClick={() => { setShowScript(false); setScript(''); }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs disabled:bg-gray-300"
                  onClick={() => { handleAction('script', script); setShowScript(false); setScript(''); }}
                  disabled={actionLoading || !script.trim()}
                >
                  Run
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {selectedServer && <ServerMetricsChart server={selectedServer.name} />}
    </div>
  );
} 