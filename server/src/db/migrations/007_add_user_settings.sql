-- SafePath — Add Preferences to Users
-- Run: psql -d safepath_db -f 007_add_user_settings.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
