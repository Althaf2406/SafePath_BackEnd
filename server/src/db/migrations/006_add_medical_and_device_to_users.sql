-- SafePath — Add Medical, Location Accuracy, and Device Token to Users
-- Run: psql -d safepath_db -f 006_add_medical_and_device_to_users.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(3),
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS device_token TEXT;
