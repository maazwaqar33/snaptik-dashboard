import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import { ROLE_PERMISSIONS } from '@snaptik/types';
import type { AccessTokenPayload } from './tokens';

export type AppAbility = MongoAbility;

export function buildAbility(admin: Pick<AccessTokenPayload, 'role' | 'customPermissions'>): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const perms = [
    ...(ROLE_PERMISSIONS[admin.role as keyof typeof ROLE_PERMISSIONS] ?? []),
    ...(admin.customPermissions ?? []),
  ];

  for (const perm of perms) {
    if (perm === '*') {
      can('manage', 'all');
    } else {
      const [action, subject] = perm.split(':');
      if (action && subject) can(action, subject);
    }
  }

  return build();
}
