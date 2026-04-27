import { useEffect, useState } from 'react';
import { Map } from 'lucide-react';
import { getHeatmapData } from '../services/api';
import type { HeatmapData } from '../types';
import clsx from 'clsx';

function getRiskColor(score: number) {
  if (score >= 8) return 'bg-red-500';
  if (score >= 6) return 'bg-orange-500';
  if (score >= 4) return 'bg-yellow-500';
  if (score >= 2) return 'bg-blue-500';
  return 'bg-green-500';
}

function getRiskBorder(score: number) {
  if (score >= 8) return 'border-red-500/40';
  if (score >= 6) return 'border-orange-500/40';
  if (score >= 4) return 'border-yellow-500/40';
  if (score >= 2) return 'border-blue-500/40';
  return 'border-green-500/40';
}

export default function HeatmapPage() {
  const [data, setData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    getHeatmapData().then((r) => setData(r.data)).catch(() => {});
  }, []);

  const grouped = data.reduce(
    (acc, item) => {
      if (!acc[item.location_name]) acc[item.location_name] = [];
      acc[item.location_name].push(item);
      return acc;
    },
    {} as Record<string, HeatmapData[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risk Heatmaps</h1>
        <p className="text-slate-400">
          Visual high-risk zone mapping across all locations
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
        <span className="text-sm text-slate-400">Risk Level:</span>
        {[
          { label: 'Critical (8-10)', color: 'bg-red-500' },
          { label: 'High (6-8)', color: 'bg-orange-500' },
          { label: 'Medium (4-6)', color: 'bg-yellow-500' },
          { label: 'Low (2-4)', color: 'bg-blue-500' },
          { label: 'Minimal (0-2)', color: 'bg-green-500' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={clsx('h-3 w-3 rounded-full', color)} />
            <span className="text-xs text-slate-300">{label}</span>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="py-20 text-center">
          <Map className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">
            No heatmap data available. Add zones and incidents to see risk
            visualization.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([locationName, zones]) => (
          <div key={locationName}>
            <h2 className="mb-3 text-lg font-semibold text-white">
              {locationName}
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {zones.map((zone) => (
                <div
                  key={zone.zone_id}
                  className={clsx(
                    'rounded-xl border p-4 transition-colors',
                    getRiskBorder(zone.risk_score),
                    'bg-slate-900 hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{zone.zone_name}</h4>
                    <div
                      className={clsx(
                        'h-4 w-4 rounded-full',
                        getRiskColor(zone.risk_score)
                      )}
                    />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {zone.risk_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400">Risk Score</p>
                  <div className="mt-2 text-xs text-slate-400">
                    {zone.incident_count} incidents
                  </div>
                  {Object.keys(zone.severity_breakdown).length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {Object.entries(zone.severity_breakdown).map(
                        ([sev, count]) => (
                          <span
                            key={sev}
                            className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300"
                          >
                            {sev}: {count}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
