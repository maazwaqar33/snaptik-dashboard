/**
 * Seed script — creates one admin per role for local QA testing.
 * Run: pnpm --filter @snaptik/api seed
 *
 * QA TEST CREDENTIALS
 * ───────────────────────────────────────────────────────────────
 * super_admin  admin@snaptik.com          Password: Admin@1234!
 * moderator    moderator@snaptik.com      Password: Mod@1234!
 * support      support@snaptik.com        Password: Support@1
 * analyst      analyst@snaptik.com        Password: Analyst@1
 * auditor      auditor@snaptik.com        Password: Auditor@1
 * ───────────────────────────────────────────────────────────────
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import { config } from '../config';
import { Admin  } from '../models/admin.model';
import { Settings, DEFAULT_SETTINGS } from '../models/settings.model';

const QA_ADMINS = [
  {
    email:    'admin@snaptik.com',
    name:     'Super Admin',
    password: 'Admin@1234!',
    role:     'super_admin' as const,
  },
  {
    email:    'moderator@snaptik.com',
    name:     'Content Moderator',
    password: 'Mod@1234!',
    role:     'moderator' as const,
  },
  {
    email:    'support@snaptik.com',
    name:     'Support Agent',
    password: 'Support@1',
    role:     'support' as const,
  },
  {
    email:    'analyst@snaptik.com',
    name:     'Data Analyst',
    password: 'Analyst@1',
    role:     'analyst' as const,
  },
  {
    email:    'auditor@snaptik.com',
    name:     'Compliance Auditor',
    password: 'Auditor@1',
    role:     'auditor' as const,
  },
];

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('[Seed] Connected to MongoDB\n');

  // Seed admins
  let created = 0;
  let skipped = 0;
  for (const qa of QA_ADMINS) {
    const exists = await Admin.findOne({ email: qa.email });
    if (exists) {
      console.log(`  ⟳  Skipped  ${qa.email} (already exists)`);
      skipped++;
      continue;
    }
    const passwordHash = await bcrypt.hash(qa.password, 12);
    await Admin.create({
      email: qa.email, name: qa.name, passwordHash,
      role: qa.role, isActive: true,
      customPermissions: [],
    });
    console.log(`  ✓  Created  ${qa.email}  [${qa.role}]`);
    created++;
  }

  // Seed default settings
  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    await Settings.insertMany(DEFAULT_SETTINGS.map(s => ({ ...s, updatedBy: undefined })));
    console.log(`\n  ✓  Seeded ${DEFAULT_SETTINGS.length} default settings`);
  } else {
    console.log(`\n  ⟳  Settings already seeded (${settingsCount} records)`);
  }

  await mongoose.disconnect();

  console.log(`\n${'─'.repeat(60)}`);
  console.log('QA TEST CREDENTIALS');
  console.log('─'.repeat(60));
  console.log('Role            Email                       Password');
  console.log('─'.repeat(60));
  for (const qa of QA_ADMINS) {
    console.log(`${qa.role.padEnd(16)}${qa.email.padEnd(32)}${qa.password}`);
  }
  console.log('─'.repeat(60));
  console.log(`\n  Created: ${created}  |  Skipped: ${skipped}\n`);
}

seed().catch(err => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
