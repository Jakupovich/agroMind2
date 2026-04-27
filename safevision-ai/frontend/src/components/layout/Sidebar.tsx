import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MonitorPlay,
  AlertTriangle,
  BarChart3,
  Map,
  Camera,
  Users,
  CreditCard,
  Settings,
  Shield,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monitoring', icon: MonitorPlay, label: 'Live Monitoring' },
  { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/heatmap', icon: Map, label: 'Heatmaps' },
  { to: '/risk', icon: TrendingUp, label: 'Risk Prediction' },
  { to: '/cameras', icon: Camera, label: 'Cameras' },
  { to: '/locations', icon: MapPin, label: 'Locations' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
        <Shield className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-lg font-bold text-white">SafeVision</h1>
          <p className="text-xs text-slate-400">AI Security Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="text-xs text-slate-500">SafeVision AI v0.1.0</p>
      </div>
    </aside>
  );
}
