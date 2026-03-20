import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon:         LucideIcon;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
      <Icon className="h-10 w-10 opacity-30" />
      <p className="font-medium text-white/60">{title}</p>
      {description && <p className="max-w-xs text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
