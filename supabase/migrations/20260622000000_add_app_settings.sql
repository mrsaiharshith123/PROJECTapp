-- App settings JSON blob for cross-device preference sync (language, theme, income, etc.)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS app_settings jsonb DEFAULT NULL;
