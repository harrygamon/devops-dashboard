import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, TimeScale);

interface Metric {
  timestamp: string;
  cpu_load: number;
  mem_used: number;
  mem_total: number;
  disk_used: number;
  disk_total: number;
}

export default function ServerMetricsChart({ server }: { server: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!server) return;
    setLoading(true);
    fetch(`/api/metrics/history?server=${encodeURIComponent(server)}`)
      .then(res => res.json())
      .then(res => {
        setMetrics(res.metrics || []);
        setLoading(false);
      });
  }, [server]);

  if (loading) return <div className="text-xs text-gray-400">Loading metrics...</div>;
  if (!metrics.length) return <div className="text-xs text-gray-400">No historical data.</div>;

  const labels = metrics.map(m => m.timestamp).reverse();
  const cpu = metrics.map(m => m.cpu_load).reverse();
  const mem = metrics.map(m => m.mem_used / m.mem_total * 100).reverse();
  const disk = metrics.map(m => m.disk_used / m.disk_total * 100).reverse();

  const data = {
    labels,
    datasets: [
      {
        label: 'CPU Load',
        data: cpu,
        borderColor: 'rgb(59,130,246)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Memory %',
        data: mem,
        borderColor: 'rgb(16,185,129)',
        backgroundColor: 'rgba(16,185,129,0.2)',
        yAxisID: 'y1',
      },
      {
        label: 'Disk %',
        data: disk,
        borderColor: 'rgb(234,179,8)',
        backgroundColor: 'rgba(234,179,8,0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: { unit: 'minute' as const },
        title: { display: true, text: 'Time' },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'CPU Load' },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Percent (%)' },
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <h3 className="text-sm font-semibold mb-2">Historical Metrics</h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
} 