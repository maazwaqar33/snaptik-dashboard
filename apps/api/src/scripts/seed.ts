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
import { AppUser } from '../models/app_user.model';
import { FlaggedContent } from '../models/flagged_content.model';
import { Report } from '../models/report.model';

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

  // ── QA: seed app users ────────────────────────────────────────────────────
  const userCount = await AppUser.countDocuments();
  if (userCount === 0) {
    await AppUser.insertMany([
      { username: 'dance_queen_lena', email: 'lena.kowalski@example.com', displayName: 'Lena K.', isVerified: true, isBanned: false, followersCount: 412300, followingCount: 890, uploadsCount: 214, joinedAt: new Date('2024-02-14'), lastActiveAt: new Date('2026-03-14'), bio: 'Dance. Create. Repeat.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=lena', totalLikes: 3820000, totalViews: 21500000, warningCount: 0, banHistory: [] },
      { username: 'chef_mario_g', email: 'mario.garcia@example.com', displayName: 'Mario Garcia', isVerified: false, isBanned: false, followersCount: 87600, followingCount: 302, uploadsCount: 78, joinedAt: new Date('2024-06-01'), lastActiveAt: new Date('2026-03-13'), bio: 'Home chef. Italian food obsessed.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mario', totalLikes: 540000, totalViews: 3200000, warningCount: 1, banHistory: [] },
      { username: 'spammer_xbot99', email: 'xbot99@tempmail.io', displayName: 'xbot99', isVerified: false, isBanned: true, followersCount: 12, followingCount: 14000, uploadsCount: 3, joinedAt: new Date('2026-01-20'), lastActiveAt: new Date('2026-01-22'), bio: '', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=xbot99', totalLikes: 2, totalViews: 180, warningCount: 2, banReason: 'Mass spam follow/unfollow automation', banHistory: [{ reason: 'Mass spam automation', bannedAt: new Date('2026-01-22'), bannedBy: 'admin@snaptik.com' }] },
      { username: 'fitness_yara', email: 'yara.hassan@example.com', displayName: 'Yara Hassan', isVerified: true, isBanned: false, followersCount: 1230000, followingCount: 450, uploadsCount: 621, joinedAt: new Date('2023-09-10'), lastActiveAt: new Date('2026-03-15'), bio: 'Certified PT. Daily workouts, no excuses.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=yara', totalLikes: 14800000, totalViews: 89000000, warningCount: 0, banHistory: [] },
      { username: 'comedy_bro_raj', email: 'raj.patel@example.com', displayName: 'Raj Patel', isVerified: false, isBanned: false, followersCount: 33400, followingCount: 215, uploadsCount: 102, joinedAt: new Date('2024-11-05'), lastActiveAt: new Date('2026-03-10'), bio: 'Making the internet laugh.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=raj', totalLikes: 210000, totalViews: 1900000, warningCount: 0, banHistory: [] },
      { username: 'travel_kai', email: 'kai.nguyen@example.com', displayName: 'Kai Nguyen', isVerified: true, isBanned: false, followersCount: 560000, followingCount: 720, uploadsCount: 388, joinedAt: new Date('2023-05-22'), lastActiveAt: new Date('2026-03-14'), bio: '60 countries. Counting.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kai', totalLikes: 6400000, totalViews: 38000000, warningCount: 0, banHistory: [] },
      { username: 'hatefull_user77', email: 'hateful77@anon.net', displayName: 'user77', isVerified: false, isBanned: true, followersCount: 45, followingCount: 90, uploadsCount: 11, joinedAt: new Date('2025-08-01'), lastActiveAt: new Date('2025-12-10'), bio: '', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user77', totalLikes: 30, totalViews: 900, warningCount: 3, banReason: 'Repeated harassment and hate speech', banHistory: [{ reason: 'Repeated harassment and hate speech after 3 warnings', bannedAt: new Date('2025-12-10'), bannedBy: 'admin@snaptik.com' }] },
      { username: 'bookworm_sofia', email: 'sofia.andersson@example.com', displayName: 'Sofia A.', isVerified: false, isBanned: false, followersCount: 19800, followingCount: 430, uploadsCount: 55, joinedAt: new Date('2025-03-18'), lastActiveAt: new Date('2026-03-12'), bio: 'BookTok. 200+ books a year.', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sofia', totalLikes: 98000, totalViews: 760000, warningCount: 0, banHistory: [] },
    ]);
    console.log('  ✓  Seeded 8 QA app users');
  } else {
    console.log(`  ⟳  App users already seeded (${userCount} records)`);
  }

  // ── QA: seed flagged content ───────────────────────────────────────────────
  const contentCount = await FlaggedContent.countDocuments();
  if (contentCount === 0) {
    await FlaggedContent.insertMany([
      { type: 'video',   authorId: 'qa_usr_3', authorUsername: 'spammer_xbot99',   videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', thumbnailUrl: 'https://picsum.photos/seed/cnt001/400/700', caption: 'Follow me for FREE iPhone!! Click link in bio', aiFlags: { nsfw: 0.04, violence: 0.01, spam: 0.97, hateSpeech: 0.02 }, moderationStatus: 'pending', createdAt: new Date('2026-01-21') },
      { type: 'video',   authorId: 'qa_usr_7', authorUsername: 'hatefull_user77',  videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', thumbnailUrl: 'https://picsum.photos/seed/cnt002/400/700', caption: 'These people should not exist [slur removed]', aiFlags: { nsfw: 0.12, violence: 0.31, spam: 0.05, hateSpeech: 0.91 }, moderationStatus: 'rejected', moderatedAt: new Date('2025-12-10'), moderatedBy: 'moderator@snaptik.com', moderationReason: 'Hate speech — targeted slurs', createdAt: new Date('2025-12-09') },
      { type: 'video',   authorId: 'qa_usr_5', authorUsername: 'comedy_bro_raj',   videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', thumbnailUrl: 'https://picsum.photos/seed/cnt003/400/700', caption: 'When bae says "we need to talk"', aiFlags: { nsfw: 0.08, violence: 0.02, spam: 0.03, hateSpeech: 0.01 }, moderationStatus: 'approved', moderatedAt: new Date('2026-03-10'), moderatedBy: 'moderator@snaptik.com', moderationReason: 'Review: false positive — comedy', createdAt: new Date('2026-03-10') },
      { type: 'video',   authorId: 'qa_usr_8', authorUsername: 'bookworm_sofia',   videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', thumbnailUrl: 'https://picsum.photos/seed/cnt004/400/700', caption: 'Reading wrap-up: 15 books in February', aiFlags: { nsfw: 0.01, violence: 0.00, spam: 0.02, hateSpeech: 0.00 }, moderationStatus: 'pending', createdAt: new Date('2026-03-01') },
      { type: 'comment', authorId: 'qa_usr_3', authorUsername: 'spammer_xbot99',   videoUrl: '', thumbnailUrl: '', caption: 'DM me for easy money, make $500/day from home guaranteed', aiFlags: { nsfw: 0.02, violence: 0.00, spam: 0.99, hateSpeech: 0.01 }, moderationStatus: 'pending', createdAt: new Date('2026-01-21') },
      { type: 'video',   authorId: 'qa_usr_1', authorUsername: 'dance_queen_lena', videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', thumbnailUrl: 'https://picsum.photos/seed/cnt007/400/700', caption: 'New choreo drop — which outfit is better? A or B?', aiFlags: { nsfw: 0.41, violence: 0.00, spam: 0.02, hateSpeech: 0.00 }, moderationStatus: 'pending', createdAt: new Date('2026-03-13') },
    ]);
    console.log('  ✓  Seeded 6 QA flagged content items');
  } else {
    console.log(`  ⟳  Flagged content already seeded (${contentCount} records)`);
  }

  // ── QA: seed reports ──────────────────────────────────────────────────────
  const reportCount = await Report.countDocuments();
  if (reportCount === 0) {
    await Report.insertMany([
      { type: 'spam',          status: 'pending',   reporterId: 'qa_usr_4', reporterUsername: 'fitness_yara',   targetType: 'comment', targetId: 'qa_cnt_5', reason: 'This comment is pure spam — promoting get-rich-quick scheme.', createdAt: new Date('2026-01-21') },
      { type: 'harassment',    status: 'in_review', reporterId: 'qa_usr_6', reporterUsername: 'travel_kai',     targetType: 'user',    targetId: 'qa_usr_7', reason: 'User keeps sending hateful DMs and commenting with slurs.', notes: 'Multiple reports — escalate.', assignedTo: { _id: 'qa_adm_1', name: 'Content Moderator', email: 'moderator@snaptik.com' }, createdAt: new Date('2025-12-08') },
      { type: 'nsfw',          status: 'resolved',  reporterId: 'qa_usr_2', reporterUsername: 'chef_mario_g',   targetType: 'video',   targetId: 'qa_cnt_7', reason: 'Dance video seems inappropriate — too suggestive.', notes: 'Reviewed — within guidelines. No action.', assignedTo: { _id: 'qa_adm_1', name: 'Content Moderator', email: 'moderator@snaptik.com' }, resolvedAction: 'dismiss', resolvedAt: new Date('2026-03-14'), resolvedBy: 'moderator@snaptik.com', createdAt: new Date('2026-03-13') },
      { type: 'misinformation', status: 'pending',   reporterId: 'qa_usr_8', reporterUsername: 'bookworm_sofia',  targetType: 'video', targetId: 'qa_cnt_6', reason: 'Video claims pasta takes 20 min but requires 1hr dough rest.', createdAt: new Date('2026-02-15') },
      { type: 'spam',          status: 'resolved',  reporterId: 'qa_usr_6', reporterUsername: 'travel_kai',     targetType: 'user',    targetId: 'qa_usr_3', reason: 'Bot account — followed then unfollowed me 5 times in an hour.', notes: 'Confirmed bot. Account banned.', assignedTo: { _id: 'qa_adm_1', name: 'Content Moderator', email: 'moderator@snaptik.com' }, resolvedAction: 'remove', resolvedAt: new Date('2026-01-22'), resolvedBy: 'moderator@snaptik.com', createdAt: new Date('2026-01-21') },
      { type: 'other',         status: 'pending',   reporterId: 'qa_usr_1', reporterUsername: 'dance_queen_lena', targetType: 'video', targetId: 'qa_cnt_1', reason: 'Someone copied my original choreography without credit.', createdAt: new Date('2026-03-05') },
    ]);
    console.log('  ✓  Seeded 6 QA reports');
  } else {
    console.log(`  ⟳  Reports already seeded (${reportCount} records)`);
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
