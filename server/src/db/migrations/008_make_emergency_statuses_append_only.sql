-- 008_make_emergency_statuses_append_only.sql
-- Removes the unique constraint on user_id to allow multiple emergency status logs per user.

ALTER TABLE emergency_statuses DROP CONSTRAINT IF EXISTS emergency_statuses_user_id_key;
