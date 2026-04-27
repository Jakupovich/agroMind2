import { useEffect, useState } from 'react';
import { AlertTriangle, Filter, CheckCircle2 } from 'lucide-react';
import { getIncidents, updateIncident } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import type { Incident } from '../types';
import clsx from 'clsx';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = () => {
    const params: Record<string, string | number> = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    if (severityFilter) params.severity = severityFilter;
    if (typeFilter) params.incident_type = typeFilter;
    getIncidents(params).then((r) => setIncidents(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [statusFilter, severityFilter, typeFilter]);

  const resolve = async (id: number) => {
    await updateIncident(id, { status: 'resolved' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incident Management</h1>
          <p className="text-slate-400">Review, manage, and resolve security incidents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-5 w-5 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="">All Types</option>
          <option value="violence">Violence</option>
          <option value="bullying">Bullying</option>
          <option value="weapon">Weapon</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Severity</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Confidence</th>
              <th className="px-5 py-3 font-medium">Detected</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-slate-400"
                >
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  No incidents found
                </td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3 text-slate-300">#{inc.id}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium uppercase text-white">
                      {inc.incident_type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-slate-300">
                    {inc.description}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        inc.status === 'open'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      )}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {(inc.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(inc.detected_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    {inc.status === 'open' && (
                      <button
                        onClick={() => resolve(inc.id)}
                        className="flex items-center gap-1 rounded-lg bg-green-600/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600/30"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
