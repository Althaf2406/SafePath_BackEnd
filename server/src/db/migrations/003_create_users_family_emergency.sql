-- SafePath — Users, Family Groups, Family Members, Emergency Statuses
-- Run: psql -d safepath_db -f 003_create_users_family_emergency.sql

-- ── 1. Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    phone               VARCHAR(30),
    profile_image_url   TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── 2. Family Groups ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    invite_code     VARCHAR(12) NOT NULL UNIQUE,
    admin_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members     INTEGER NOT NULL DEFAULT 20,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_family_groups_invite ON family_groups (invite_code);
CREATE INDEX IF NOT EXISTS idx_family_groups_admin  ON family_groups (admin_user_id);

-- ── 3. Family Members (join table) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'member'  CHECK (role IN ('admin','member')),
    status          VARCHAR(20) NOT NULL DEFAULT 'unknown'
                        CHECK (status IN ('safe','need_help','evacuating','sos','unknown')),
    is_safe         BOOLEAN,
    last_latitude   DOUBLE PRECISION,
    last_longitude  DOUBLE PRECISION,
    last_updated    TIMESTAMP,
    device_token    TEXT,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fm_group  ON family_members (group_id);
CREATE INDEX IF NOT EXISTS idx_fm_user   ON family_members (user_id);

-- ── 4. Emergency Statuses ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_statuses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'unknown'
                            CHECK (status IN ('safe','need_help','evacuating','sos','unknown')),
    message             TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    is_sos              BOOLEAN NOT NULL DEFAULT false,
    escalation_level    INTEGER NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
    responder_id        UUID REFERENCES users(id),
    responder_name      VARCHAR(150),
    resolved_at         TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)   -- one active status per user (UPSERT pattern)
);

CREATE INDEX IF NOT EXISTS idx_emergency_user   ON emergency_statuses (user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sos    ON emergency_statuses (is_sos) WHERE is_sos = true;
