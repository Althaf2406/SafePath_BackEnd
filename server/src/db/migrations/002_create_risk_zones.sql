CREATE TABLE IF NOT EXISTS risk_zones (

    id SERIAL PRIMARY KEY,

    city VARCHAR(100) NOT NULL,

    disaster_type VARCHAR(50) NOT NULL,

    risk_level VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_city
ON risk_zones(city);

CREATE INDEX IF NOT EXISTS idx_risk_disaster
ON risk_zones(disaster_type);