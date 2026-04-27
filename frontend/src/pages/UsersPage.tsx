import { useEffect, useState } from 'react';
import { Plus, Mail, Phone } from 'lucide-react';
import { getUsers, createUser } from '../services/api';
import type { User } from '../types';
import clsx from 'clsx';

const roleColors = {
  super_admin: 'bg-purple-500/20 text-purple-400',
  org_admin: 'bg-blue-500/20 text-blue-400',
  operator: 'bg-green-500/20 text-green-400',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'operator',
    phone: '',
  });

  useEffect(() => {
    getUsers().then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(form);
    setShowAdd(false);
    setForm({ email: '', password: '', full_name: '', role: 'operator', phone: '' });
    getUsers().then((r) => setUsers(r.data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-slate-400">Manage team members and access roles</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 font-semibold text-white">Add New User</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white"
              >
                <option value="operator">Security Operator</option>
                <option value="org_admin">Organization Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add User
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Alerts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/50">
                <td className="px-5 py-3 font-medium text-white">{u.full_name}</td>
                <td className="px-5 py-3 text-slate-300">{u.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      roleColors[u.role] || roleColors.operator
                    )}
                  >
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      'text-xs',
                      u.is_active ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    {u.email_alerts && (
                      <Mail className="h-4 w-4 text-blue-400" />
                    )}
                    {u.sms_alerts && (
                      <Phone className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
