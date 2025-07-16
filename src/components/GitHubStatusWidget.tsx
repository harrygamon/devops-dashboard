"use client";

import React, { useEffect, useState } from 'react';

interface RepoStatus {
  repo: string;
  status: string;
  html_url: string;
  name: string;
  commit: string;
  time: string;
  error?: boolean;
}
interface Account {
  label: string;
  repos: RepoStatus[];
}

const statusColor = (status: string) => {
  if (status === 'success') return 'bg-green-500';
  if (status === 'failure' || status === 'cancelled' || status === 'timed_out') return 'bg-red-500';
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') return 'bg-yellow-400';
  return 'bg-gray-400';
};

export default function GitHubStatusWidget() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = (label?: string) => {
    setLoading(true);
    fetch(`/api/github-status${label ? `?account=${encodeURIComponent(label)}` : ''}`)
      .then(res => res.json())
      .then(res => {
        setAccounts(res.accounts || []);
        setLoading(false);
        if (res.accounts && res.accounts.length > 0 && !selected) {
          setSelected(res.accounts[0].label);
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

  useEffect(() => {
    if (selected) fetchStatus(selected);
    // eslint-disable-next-line
  }, [selected]);

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
    return <div className="text-red-500">Failed to load GitHub status.</div>;
  }

  const selectedAccount = accounts.find(a => a.label === selected);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="mb-2">
        <label className="text-xs text-gray-500 mr-2">Account/Org:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {accounts.map(a => (
            <option key={a.label} value={a.label}>{a.label}</option>
          ))}
        </select>
      </div>
      {selectedAccount && selectedAccount.repos.length === 0 && (
        <div className="text-gray-400">No repositories configured.</div>
      )}
      {selectedAccount && selectedAccount.repos.map(repo => (
        <div key={repo.repo} className="flex items-center gap-3 bg-gray-50 rounded p-2">
          <div className={`h-4 w-4 rounded-full ${statusColor(repo.status)}`} title={repo.status} />
          <div className="font-mono text-sm truncate" title={repo.repo}>{repo.repo}</div>
          <div className="text-xs text-gray-500 ml-2">{repo.status}</div>
          <div className="text-xs text-gray-400 ml-2">{repo.commit.slice(0, 7)}</div>
          <div className="text-xs text-gray-400 ml-2">{repo.time ? new Date(repo.time).toLocaleString() : ''}</div>
          <button
            className="ml-auto px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            onClick={() => repo.html_url && window.open(repo.html_url, '_blank')}
            disabled={!repo.html_url}
          >
            View Run
          </button>
        </div>
      ))}
    </div>
  );
} 