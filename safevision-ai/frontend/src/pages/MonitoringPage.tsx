import { useEffect, useState } from 'react';
import { Camera as CameraIcon, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getLocations, getCameras } from '../services/api';
import { useAlerts } from '../hooks/useAlerts';
import type { Camera, Location } from '../types';

export default function MonitoringPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const { alerts } = useAlerts();

  useEffect(() => {
    getLocations()
      .then((r) => {
        setLocations(r.data);
        if (r.data.length > 0) setSelectedLocation(r.data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      getCameras(selectedLocation)
        .then((r) => setCameras(r.data))
        .catch(() => {});
    }
  }, [selectedLocation]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Monitoring</h1>
          <p className="text-slate-400">Real-time camera feeds and alerts</p>
        </div>
        <select
          value={selectedLocation ?? ''}
          onChange={(e) => setSelectedLocation(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alert Feed */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Active Alerts ({alerts.length})</span>
          </div>
          <div className="mt-2 space-y-1">
            {alerts.slice(0, 3).map((a) => (
              <p key={a.incident_id} className="text-sm text-red-300">
                {a.severity.toUpperCase()}: {a.description} — {a.camera_name}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Camera Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cameras.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <CameraIcon className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">
              No cameras configured for this location
            </p>
          </div>
        ) : (
          cameras.map((cam) => (
            <div
              key={cam.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
            >
              {/* Camera Feed Placeholder */}
              <div className="relative aspect-video bg-slate-800">
                <div className="flex h-full items-center justify-center">
                  <CameraIcon className="h-16 w-16 text-slate-700" />
                </div>
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs">
                  {cam.status === 'active' ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">LIVE</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-400" />
                      <span className="text-red-400">OFFLINE</span>
                    </>
                  )}
                </div>
                {cam.detection_enabled && (
                  <div className="absolute right-3 top-3 rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-400">
                    AI Active
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium text-white">{cam.name}</h4>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {cam.violence_detection && (
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                      Violence
                    </span>
                  )}
                  {cam.bullying_detection && (
                    <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-400">
                      Bullying
                    </span>
                  )}
                  {cam.weapon_detection && (
                    <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-xs text-purple-400">
                      Weapons
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
