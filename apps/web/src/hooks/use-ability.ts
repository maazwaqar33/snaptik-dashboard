'use client';

import { useMemo } from 'react';
import { createMongoAbility, type MongoAbility } from '@casl/ability';
import { useAuthStore } from '@/store/auth';
import { ROLE_PERMISSIONS } from '@snaptik/types';

// Permission string format: "action:resource"  e.g. "read:users", "ban:users", "*"
type AppAbility = MongoAbility<[string, string]>;

/**
 * Returns a CASL Ability instance derived from the current admin's role
 * and any custom per-user permissions. Recomputes only when role/permissions change.
 *
 * Usage:
 *   const ability = useAbility();
 *   if (ability.can('ban', 'users')) { ... }
 */
export function useAbility(): AppAbility {
  const admin = useAuthStore((s) => s.admin);

  return useMemo(() => {
    if (!admin) return createMongoAbility([]);

    // Start with role-level permissions
    const rolePerms = ROLE_PERMISSIONS[admin.role] ?? [];
    const allPerms = [...rolePerms, ...admin.customPermissions];

    // Wildcard super-admin — can do anything
    if (allPerms.includes('*')) {
      return createMongoAbility([{ action: 'manage', subject: 'all' }]);
    }

    // Map "action:resource" strings to CASL rule objects
    const rules = allPerms.map((perm) => {
      const [action, subject] = perm.split(':');
      return { action: action ?? perm, subject: subject ?? 'all' };
    });

    return createMongoAbility(rules);
  }, [admin?.role, admin?.customPermissions]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Helper: check a single permission string without needing the full ability object.
 * Useful in server components or utility functions where hooks can't be used.
 */
export function hasPermission(
  role: string,
  customPermissions: string[],
  permission: string,
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? [];
  const all = [...rolePerms, ...customPermissions];
  if (all.includes('*')) return true;
  return all.includes(permission);
}
