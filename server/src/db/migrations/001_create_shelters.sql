-- SafePath — Shelter table migration
-- Run: psql -d safepath_db -f 001_create_shelters.sql

CREATE TABLE IF NOT EXISTS shelters (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(150) NOT NULL,
    address                 TEXT NOT NULL,
    latitude                DOUBLE PRECISION NOT NULL,
    longitude               DOUBLE PRECISION NOT NULL,
    capacity                INTEGER NOT NULL DEFAULT 0,
    available_capacity      INTEGER,
    contact                 VARCHAR(50),
    facilities              TEXT[] DEFAULT '{}',
    shelter_type            VARCHAR(50) NOT NULL,
    disaster_type_supported TEXT[] DEFAULT '{}',
    is_open_area            BOOLEAN DEFAULT false,
    building_level          INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for nearby queries
CREATE INDEX IF NOT EXISTS idx_shelters_coords ON shelters (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_shelters_active ON shelters (is_active);

