"use client";
import React, { useEffect, useRef, useState } from "react";

interface Server {
  name: string;
  log_paths?: string[];
  log_path?: string;
  tags?: string[];
}

export default function LogsPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<string>("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/servers.json")
      .then(res => res.json())
      .then(data => {
        setServers(data);
        if (data.length > 0) setSelected(data[0].name);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const server = servers.find(s => s.name === selected);
    if (server) {
      const logs = server.log_paths || (server.log_path ? [server.log_path] : []);
      setLogFiles(logs);
      setSelectedLog(logs[0] || "");
    }
  }, [selected, servers]);

  useEffect(() => {
    if (!selected || !selectedLog) return;
    setLines([]);
    setError(null);
    const es = new EventSource(`/api/logs/stream?server=${encodeURIComponent(selected)}&log=${encodeURIComponent(selectedLog)}`);
    es.onmessage = (e) => {
      setLines((prev) => [...prev, ...e.data.split("\n")]);
    };
    es.onerror = (e) => {
      setError("Connection lost or error streaming logs.");
      es.close();
    };
    return () => es.close();
  }, [selected, selectedLog]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  // Group servers by tag
  const tagGroups: { [tag: string]: Server[] } = {};
  servers.forEach(s => {
    (s.tags || ["untagged"]).forEach(tag => {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(s);
    });
  });
  const sortedTags = Object.keys(tagGroups).sort();

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Log Viewer</h1>
        <div className="mb-2 flex gap-4 items-center">
          <div>
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
          {logFiles.length > 1 && (
            <div>
              <label className="text-xs text-gray-500 mr-2">Log file:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedLog}
                onChange={e => setSelectedLog(e.target.value)}
              >
                {logFiles.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="bg-black rounded-lg shadow p-4 h-[500px] overflow-y-auto font-mono text-xs text-green-200" ref={logRef} style={{lineHeight: '1.4'}}>
          {lines.length === 0 && !error && <div className="text-gray-400">Waiting for log data...</div>}
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
          {error && <div className="text-red-400">{error}</div>}
        </div>
      </div>
    </main>
  );
} 