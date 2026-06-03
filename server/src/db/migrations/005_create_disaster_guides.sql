CREATE TABLE IF NOT EXISTS disaster_preparation_guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disaster_type       VARCHAR(100) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    handling_procedures JSONB DEFAULT '[]'::JSONB,
    icon_name           VARCHAR(100) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disaster_guides_type ON disaster_preparation_guides (disaster_type);
