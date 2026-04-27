import { Bell, LogOut, User } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import { authStore } from '../../store/auth';
import { useState } from 'react';
import clsx from 'clsx';

export default function Header() {
  const { alerts } = useAlerts();
  const [showAlerts, setShowAlerts] = useState(false);
  const state = authStore.getState();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur">
      <div />

      <div className="flex items-center gap-4">
        {/* Alert Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {alerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-12 w-96 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-700 px-4 py-3">
                <h3 className="font-semibold text-white">Live Alerts</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-400">
                    No active alerts
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.incident_id}
                      className="border-b border-slate-800 p-3 hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'h-2 w-2 rounded-full',
                            alert.severity === 'critical' && 'bg-red-500',
                            alert.severity === 'high' && 'bg-orange-500',
                            alert.severity === 'medium' && 'bg-yellow-500',
                            alert.severity === 'low' && 'bg-blue-500'
                          )}
                        />
                        <span className="text-sm font-medium text-white">
                          {alert.incident_type.toUpperCase()}
                        </span>
                        <span className="ml-auto text-xs text-slate-400">
                          {alert.camera_name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {alert.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <User className="h-5 w-5" />
          <span>{state.user?.full_name || 'User'}</span>
        </div>

        <button
          onClick={() => {
            authStore.logout();
            window.location.href = '/login';
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
