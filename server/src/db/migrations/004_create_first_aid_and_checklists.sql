-- Run: psql -d safepath_db -f 004_create_first_aid_and_checklists.sql

CREATE TABLE IF NOT EXISTS first_aid_guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    short_description   TEXT NOT NULL,
    steps               JSONB DEFAULT '[]'::JSONB,
    icon_name           VARCHAR(100) NOT NULL,
    required_kit        JSONB DEFAULT '[]'::JSONB,
    detailed_steps      JSONB DEFAULT '[]'::JSONB,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_checklists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    is_checked          BOOLEAN DEFAULT false,
    category            VARCHAR(50) NOT NULL,
    quantity            INTEGER DEFAULT 1,
    priority            VARCHAR(50) DEFAULT 'Medium',
    disaster_type       VARCHAR(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_checklists_user ON custom_checklists (user_id);
