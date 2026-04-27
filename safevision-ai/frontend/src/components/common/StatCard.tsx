import type { ReactNode } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}

const colorMap = {
  blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/30',
  red: 'from-red-600/20 to-red-600/5 border-red-500/30',
  green: 'from-green-600/20 to-green-600/5 border-green-500/30',
  yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30',
  purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
};

const iconColorMap = {
  blue: 'text-blue-400',
  red: 'text-red-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border bg-gradient-to-br p-5',
        colorMap[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-slate-400">{trend}</p>
          )}
        </div>
        <div className={clsx('rounded-lg bg-slate-800/50 p-3', iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
