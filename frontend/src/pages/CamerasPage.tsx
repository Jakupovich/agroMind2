import { useEffect, useState } from 'react';
import {
  Camera,
  Plus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getLocations, getCameras, createCamera } from '../services/api';
import type { Camera as CameraType, Location } from '../types';

export default function CamerasPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rtsp_url: '',
    violence_detection: true,
    bullying_detection: false,
    weapon_detection: false,
  });

  useEffect(() => {
    getLocations()
      .then((r) => {
        setLocations(r.data);
        if (r.data.length > 0 && !selectedLocation) setSelectedLocation(r.data[0].id);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    await createCamera(selectedLocation, form);
    setShowAdd(false);
    setForm({ name: '', rtsp_url: '', violence_detection: true, bullying_detection: false, weapon_detection: false });
    getCameras(selectedLocation).then((r) => setCameras(r.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Camera Management</h1>
          <p className="text-slate-400">Configure and manage camera feeds</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedLocation ?? ''}
            onChange={(e) => setSelectedLocation(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Camera
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Add New Camera</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Camera Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">RTSP URL</label>
              <input
                value={form.rtsp_url}
                onChange={(e) => setForm({ ...form, rtsp_url: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                placeholder="rtsp://..."
                required
              />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            {(['violence_detection', 'bullying_detection', 'weapon_detection'] as const).map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-slate-600"
                />
                {key.replace('_detection', '').charAt(0).toUpperCase() +
                  key.replace('_detection', '').slice(1)}{' '}
                Detection
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Camera
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras.map((cam) => (
          <div key={cam.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-400" />
                <h4 className="font-medium text-white">{cam.name}</h4>
              </div>
              {cam.status === 'active' ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400 break-all">{cam.rtsp_url}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cam.violence_detection && (
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">Violence</span>
              )}
              {cam.bullying_detection && (
                <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">Bullying</span>
              )}
              {cam.weapon_detection && (
                <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">Weapons</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
