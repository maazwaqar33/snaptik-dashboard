import { cn } from '@/lib/cn';
import type { UserStatus } from '@/types/platform';

const STATUS_RING: Record<UserStatus, string> = {
  active:    'ring-success/60',
  banned:    'ring-danger/60',
  suspended: 'ring-warning/60',
  pending:   'ring-white/20',
};

interface UserAvatarProps {
  displayName: string;
  avatarUrl?:  string;
  status:      UserStatus;
  size?:       'sm' | 'md';
}

export function UserAvatar({ displayName, avatarUrl, status, size = 'md' }: UserAvatarProps) {
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-xs';

  return (
    <div className={cn('shrink-0 rounded-full ring-2', sizeClass, STATUS_RING[status])}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}
