import { useEffect, useState } from 'react';
import {
  Camera,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Eye,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/common/StatCard';
import SeverityBadge from '../components/common/SeverityBadge';
import {
  getDashboardStats,
  getIncidentTrends,
  getIncidents,
  getIncidentStats,
} from '../services/api';
import type {
  DashboardStats,
  IncidentTrend,
  Incident,
  IncidentStats,
} from '../types';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];
const TYPE_COLORS = { violence: '#ef4444', bullying: '#f97316', weapon: '#a855f7' };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<IncidentTrend[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch(() => {});
    getIncidentTrends(7).then((r) => setTrends(r.data)).catch(() => {});
    getIncidents({ limit: 5 }).then((r) => setRecentIncidents(r.data)).catch(() => {});
    getIncidentStats().then((r) => setIncidentStats(r.data)).catch(() => {});
  }, []);

  const severityData = incidentStats
    ? [
        { name: 'Critical', value: incidentStats.critical },
        { name: 'High', value: incidentStats.high },
        { name: 'Medium', value: incidentStats.medium },
        { name: 'Low', value: incidentStats.low },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-slate-400">Real-time overview of your security operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Cameras"
          value={stats?.total_cameras ?? 0}
          icon={<Camera className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Active Cameras"
          value={stats?.active_cameras ?? 0}
          icon={<Eye className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Incidents Today"
          value={stats?.total_incidents_today ?? 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Open Incidents"
          value={stats?.open_incidents ?? 0}
          icon={<Activity className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Critical Alerts"
          value={stats?.critical_alerts ?? 0}
          icon={<Shield className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Avg Risk Score"
          value={stats?.avg_risk_score ?? 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Incident Trends */}
        <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Incident Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends}>
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
              <Line
                type="monotone"
                dataKey="violence"
                stroke={TYPE_COLORS.violence}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="bullying"
                stroke={TYPE_COLORS.bullying}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="weapon"
                stroke={TYPE_COLORS.weapon}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {severityData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h3 className="font-semibold text-white">Recent Incidents</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {recentIncidents.length === 0 ? (
            <p className="p-5 text-center text-sm text-slate-400">
              No incidents recorded yet
            </p>
          ) : (
            recentIncidents.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {inc.incident_type.toUpperCase()}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-xs text-slate-400">
                      #{inc.id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {inc.description}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{new Date(inc.detected_at).toLocaleString()}</p>
                  <p className="capitalize">{inc.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
