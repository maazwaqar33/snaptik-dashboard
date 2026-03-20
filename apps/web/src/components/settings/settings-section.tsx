import React from 'react';

interface SettingsSectionProps {
  title:       string;
  description: string;
  children:    React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="mb-4 border-b border-white/10 pb-4">
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
