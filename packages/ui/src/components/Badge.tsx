import React from 'react';
import type { AdminRole } from '@snaptik/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | AdminRole;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-white/10 text-white',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  super_admin: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  moderator: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  support: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  analyst: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  auditor: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant] ?? variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}
