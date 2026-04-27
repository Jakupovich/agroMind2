import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { getOrganization } from '../services/api';
import type { Organization } from '../types';

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    getOrganization().then((r) => setOrg(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400">Organization and system configuration</p>
      </div>

      {/* Organization Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Organization</h3>
        </div>
        {org && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Name</label>
              <p className="mt-1 text-white">{org.name}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Slug</label>
              <p className="mt-1 text-white">{org.slug}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Plan</label>
              <p className="mt-1 capitalize text-white">{org.subscription_plan}</p>
            </div>
            <div>
              <label className="text-sm text-slate-400">Status</label>
              <p className="mt-1 capitalize text-white">{org.subscription_status}</p>
            </div>
          </div>
        )}
      </div>

      {/* Detection Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Detection Settings
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Violence Detection Threshold', value: '65%' },
            { label: 'Weapon Detection Threshold', value: '70%' },
            { label: 'Bullying Detection Threshold', value: '60%' },
            { label: 'Alert Cooldown (seconds)', value: '10' },
            { label: 'Frame Skip Rate', value: '3' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{label}</span>
              <input
                defaultValue={value}
                className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-right text-sm text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Notification Settings
        </h3>
        <div className="space-y-3">
          {[
            'Dashboard notifications',
            'Email alerts for critical incidents',
            'SMS alerts for critical incidents',
            'Daily incident summary email',
            'Weekly analytics report',
          ].map((label) => (
            <label key={label} className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" defaultChecked className="rounded border-slate-600" />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
