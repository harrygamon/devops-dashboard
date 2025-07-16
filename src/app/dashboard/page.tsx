import React from 'react';
import GitHubStatusWidget from '@/components/GitHubStatusWidget';
import DockerStatusWidget from '@/components/DockerStatusWidget';
import ServerHealthWidget from '@/components/ServerHealthWidget';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">DevOps Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* GitHub Actions Status */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-full">
            <span className="text-xl font-semibold mb-2">GitHub Actions</span>
            <GitHubStatusWidget />
          </div>
          {/* Docker Health */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-full">
            <span className="text-xl font-semibold mb-2">Docker Health</span>
            <DockerStatusWidget />
          </div>
          {/* Server Health */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-full">
            <span className="text-xl font-semibold mb-2">Server Health</span>
            <ServerHealthWidget />
          </div>
          {/* Log Viewer */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
            <span className="text-xl font-semibold mb-2">Log Viewer</span>
            <div className="h-16 w-16 bg-gray-200 rounded mb-2" />
            <span className="text-gray-500">Logs: Loading...</span>
          </div>
        </div>
      </div>
    </main>
  );
}
