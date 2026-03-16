import mongoose, { Schema, type Document } from 'mongoose';

export type SettingsCategory = 'moderation' | 'algorithm' | 'features' | 'notifications';

export interface ISettings extends Document {
  key:         string;
  value:       unknown;
  description: string;
  category:    SettingsCategory;
  updatedBy?:  mongoose.Types.ObjectId;
  updatedAt:   Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key:         { type: String, required: true, unique: true },
    value:       { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: true },
    category:    { type: String, enum: ['moderation','algorithm','features','notifications'], required: true },
    updatedBy:   { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true, collection: 'admin_settings' },
);

SettingsSchema.index({ category: 1 });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);

type SettingsSeed = Pick<ISettings, 'key' | 'value' | 'description' | 'category'>;

// Default settings seeded on first start
export const DEFAULT_SETTINGS: SettingsSeed[] = [
  { key: 'moderation.nsfw_threshold',    value: 0.85, description: 'AI NSFW confidence threshold (0.0–1.0)', category: 'moderation' },
  { key: 'moderation.violence_threshold', value: 0.80, description: 'AI violence confidence threshold',       category: 'moderation' },
  { key: 'moderation.auto_remove',       value: true,  description: 'Auto-remove content above threshold',    category: 'moderation' },
  { key: 'algorithm.freshness_weight',   value: 0.35,  description: 'Freshness weight in feed ranking',       category: 'algorithm'  },
  { key: 'algorithm.viral_weight',       value: 0.45,  description: 'Viral score weight in feed ranking',     category: 'algorithm'  },
  { key: 'algorithm.fairness_ratio',     value: 0.20,  description: 'Creator diversity ratio',                category: 'algorithm'  },
  { key: 'features.live_streams',        value: true,  description: 'Enable live streaming feature',          category: 'features'   },
  { key: 'features.ar_effects',          value: true,  description: 'Enable AR camera effects',               category: 'features'   },
  { key: 'features.recommendations',     value: true,  description: 'Enable For You page recommendations',    category: 'features'   },
  { key: 'features.stories',             value: true,  description: 'Enable 24h stories feature',             category: 'features'   },
  { key: 'notifications.email_digest',   value: true,  description: 'Send daily email digest to admins',      category: 'notifications' },
  { key: 'notifications.alert_threshold', value: 10,   description: 'Alert when pending reports exceed N',    category: 'notifications' },
];
