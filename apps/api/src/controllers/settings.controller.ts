import type { Request, Response } from 'express';
import { Settings, DEFAULT_SETTINGS } from '../models/settings.model';

async function ensureDefaults(): Promise<void> {
  const count = await Settings.countDocuments();
  if (count === 0) {
    await Settings.insertMany(DEFAULT_SETTINGS.map(s => ({ ...s, updatedBy: undefined })));
  }
}

// GET /settings
export async function getSettings(_req: Request, res: Response): Promise<void> {
  await ensureDefaults();
  const all = await Settings.find().sort({ category: 1, key: 1 }).lean();

  // Group by category
  const grouped = all.reduce<Record<string, typeof all>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  res.json({ settings: grouped });
}

// PATCH /settings/:key
export async function updateSetting(req: Request, res: Response): Promise<void> {
  const { key } = req.params;
  const { value } = req.body ?? {};

  if (value === undefined) {
    res.status(400).json({ error: 'value is required' });
    return;
  }

  const setting = await Settings.findOneAndUpdate(
    { key },
    { value, updatedBy: req.admin.sub },
    { new: true },
  );

  if (!setting) {
    res.status(404).json({ error: `Setting "${key}" not found` });
    return;
  }

  res.json({ setting });
}
