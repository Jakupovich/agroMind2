import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { getRiskPredictions } from '../services/api';
import type { RiskPrediction } from '../types';
import clsx from 'clsx';

export default function RiskPage() {
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);

  useEffect(() => {
    getRiskPredictions().then((r) => setPredictions(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risk Predictions</h1>
        <p className="text-slate-400">
          AI-powered risk forecasting based on historical incident data
        </p>
      </div>

      {predictions.length === 0 ? (
        <div className="py-20 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 text-slate-400">
            No risk predictions available yet. The system needs historical
            incident data to generate predictions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {predictions.map((pred) => (
            <div
              key={pred.zone_id}
              className={clsx(
                'rounded-xl border p-5',
                pred.risk_level === 'critical'
                  ? 'border-red-500/30 bg-red-500/5'
                  : pred.risk_level === 'high'
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : pred.risk_level === 'medium'
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-slate-800 bg-slate-900'
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{pred.zone_name}</h3>
                <span
                  className={clsx(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    pred.risk_level === 'critical' && 'bg-red-500/20 text-red-400',
                    pred.risk_level === 'high' &&
                      'bg-orange-500/20 text-orange-400',
                    pred.risk_level === 'medium' &&
                      'bg-yellow-500/20 text-yellow-400',
                    pred.risk_level === 'low' && 'bg-blue-500/20 text-blue-400'
                  )}
                >
                  {pred.risk_level}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Risk Score</p>
                  <p className="text-2xl font-bold text-white">
                    {pred.risk_score.toFixed(1)}
                    <span className="text-sm text-slate-400">/10</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Incident Probability</p>
                  <p className="text-2xl font-bold text-white">
                    {(pred.incident_probability * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {pred.peak_hour_start !== null && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Peak: {pred.peak_hour_start}:00 — {pred.peak_hour_end}:00
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">Trend: {pred.trend}</span>
              </div>

              <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                  {pred.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
