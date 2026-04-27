import { useEffect, useState } from 'react';
import { MapPin, Plus, Building2 } from 'lucide-react';
import { getLocations, createLocation } from '../services/api';
import type { Location } from '../types';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    location_type: 'school',
    timezone: 'UTC',
  });

  useEffect(() => {
    getLocations().then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLocation(form);
    setShowAdd(false);
    setForm({ name: '', address: '', location_type: 'school', timezone: 'UTC' });
    getLocations().then((r) => setLocations(r.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-slate-400">Manage your monitored sites</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Add New Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Type</label>
              <select
                value={form.location_type}
                onChange={(e) => setForm({ ...form, location_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              >
                <option value="school">School</option>
                <option value="office">Office Building</option>
                <option value="warehouse">Warehouse</option>
                <option value="enterprise">Enterprise Facility</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Timezone</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Location
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <div key={loc.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600/20 p-2">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{loc.name}</h4>
                <p className="text-xs text-slate-400 capitalize">{loc.location_type}</p>
              </div>
            </div>
            {loc.address && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {loc.address}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Timezone: {loc.timezone}</span>
              <span className={loc.is_active ? 'text-green-400' : 'text-red-400'}>
                {loc.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
