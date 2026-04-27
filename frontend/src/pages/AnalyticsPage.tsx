import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { getIncidentTrends, getIncidentStats, getZoneRisks } from '../services/api';
import type { IncidentTrend, IncidentStats, ZoneRisk } from '../types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#a855f7'];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<IncidentTrend[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [zones, setZones] = useState<ZoneRisk[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    getIncidentTrends(days).then((r) => setTrends(r.data)).catch(() => {});
    getIncidentStats().then((r) => setStats(r.data)).catch(() => {});
    getZoneRisks().then((r) => setZones(r.data)).catch(() => {});
  }, [days]);

  const typeData = stats
    ? Object.entries(stats.by_type).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-slate-400">Incident trends, patterns, and risk analysis</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={365}>Last Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats?.total ?? 0}</p>
          <p className="text-sm text-slate-400">Total Incidents</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats?.open ?? 0}</p>
          <p className="text-sm text-slate-400">Open</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats?.resolved ?? 0}</p>
          <p className="text-sm text-slate-400">Resolved</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{stats?.critical ?? 0}</p>
          <p className="text-sm text-slate-400">Critical</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Incident Trend Area Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Incident Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="violence"
                stackId="1"
                fill="#ef4444"
                fillOpacity={0.3}
                stroke="#ef4444"
              />
              <Area
                type="monotone"
                dataKey="bullying"
                stackId="1"
                fill="#f97316"
                fillOpacity={0.3}
                stroke="#f97316"
              />
              <Area
                type="monotone"
                dataKey="weapon"
                stackId="1"
                fill="#a855f7"
                fillOpacity={0.3}
                stroke="#a855f7"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Type Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Incident Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >
                {typeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Risk Scores */}
        <div className="col-span-full rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Zone Risk Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zones}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="zone_name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 10]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="risk_score" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="incident_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
