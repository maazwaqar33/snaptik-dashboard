import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'warning' | 'danger';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'border-white/10',
    warning: 'border-orange-500/30',
    danger: 'border-red-500/30',
  };

  return (
    <div className={`rounded-xl border bg-[#121212] p-6 ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#AAAAAA]">{title}</p>
        {icon && <div className="text-[#AAAAAA]">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-white font-outfit">{value}</p>
      {trend && (
        <p className="mt-1 text-xs text-[#AAAAAA]">
          <span className={trend.value >= 0 ? 'text-green-400' : 'text-red-400'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>{' '}
          {trend.label}
        </p>
      )}
    </div>
  );
}
