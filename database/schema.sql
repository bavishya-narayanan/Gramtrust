-- =============================================================================
-- GramTrust PostgreSQL Schema
-- Blockchain-based Panchayat Transparency Platform
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE project_status AS ENUM (
  ''Pending'',
  ''In Progress'',
  ''Under Review'',
  ''Completed'',
  ''Cancelled''
);

CREATE TYPE blockchain_status AS ENUM (
  ''Not Stored'',
  ''Stored'',
  ''Tampered'',
  ''Verified'',
  ''Failed''
);

CREATE TYPE integrity_status AS ENUM (
  ''Pending'',
  ''Valid'',
  ''Mismatch'',
  ''Error''
);

CREATE TYPE transaction_status AS ENUM (
  ''Pending'',
  ''Confirmed'',
  ''Failed'',
  ''Reverted''
);

CREATE TYPE import_status AS ENUM (
  ''Success'',
  ''Partial'',
  ''Failed''
);

CREATE TYPE user_role AS ENUM (
  ''admin'',
  ''auditor'',
  ''viewer'',
  ''panchayat_officer''
);

CREATE TYPE complaint_status AS ENUM (
  ''Open'',
  ''Under Investigation'',
  ''Resolved'',
  ''Closed'',
  ''Rejected''
);

CREATE TYPE complaint_priority AS ENUM (
  ''Low'',
  ''Medium'',
  ''High'',
  ''Critical''
);

-- ---------------------------------------------------------------------------
-- TABLE: users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT          NOT NULL,
  email         TEXT          NOT NULL,
  password_hash TEXT          NOT NULL,
  role          user_role     NOT NULL DEFAULT ''viewer'',
  district      TEXT,
  state         TEXT,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_format CHECK (email ~* ''^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'')
);

-- ---------------------------------------------------------------------------
-- TABLE: projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  project_id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code       TEXT              NOT NULL,
  project_name       TEXT              NOT NULL,
  district           TEXT              NOT NULL,
  state              TEXT              NOT NULL,
  financial_year     TEXT              NOT NULL,
  amount             NUMERIC(18, 2)    NOT NULL,
  status             project_status    NOT NULL DEFAULT ''Pending'',
  blockchain_status  blockchain_status NOT NULL DEFAULT ''Not Stored'',
  blockchain_hash    TEXT,
  integrity_status   integrity_status  NOT NULL DEFAULT ''Pending'',
  imported_by        UUID              REFERENCES users(user_id) ON DELETE SET NULL,
  raw_csv_row        JSONB,
  created_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_code_year_unique UNIQUE (project_code, financial_year),
  CONSTRAINT projects_amount_positive  CHECK (amount >= 0),
  CONSTRAINT projects_year_format      CHECK (financial_year ~ ''^\d{4}-\d{2,4}$'')
);

-- ---------------------------------------------------------------------------
-- TABLE: blockchain_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  transaction_id  UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID                 NOT NULL,
  block_number    BIGINT               NOT NULL,
  hash            TEXT                 NOT NULL,
  previous_hash   TEXT,
  action          TEXT                 NOT NULL,
  amount          NUMERIC(18, 2)       NOT NULL,
  payload         JSONB                NOT NULL,
  status          transaction_status   NOT NULL DEFAULT ''Pending'',
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  CONSTRAINT blockchain_tx_hash_unique UNIQUE (hash),
  CONSTRAINT blockchain_block_positive CHECK (block_number >= 0),

  CONSTRAINT fk_blockchain_tx_project
    FOREIGN KEY (project_id)
    REFERENCES projects(project_id)
    ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- TABLE: import_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_logs (
  import_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT          NOT NULL,
  import_date     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  total_records   INTEGER       NOT NULL DEFAULT 0,
  success_count   INTEGER       NOT NULL DEFAULT 0,
  failed_count    INTEGER       NOT NULL DEFAULT 0,
  skipped_count   INTEGER       NOT NULL DEFAULT 0,
  status          import_status NOT NULL DEFAULT ''Success'',
  error_details   JSONB,
  imported_by     UUID          REFERENCES users(user_id) ON DELETE SET NULL,
  file_size_bytes BIGINT,
  checksum_sha256 TEXT,

  CONSTRAINT import_total_positive   CHECK (total_records >= 0),
  CONSTRAINT import_success_positive CHECK (success_count >= 0),
  CONSTRAINT import_failed_positive  CHECK (failed_count  >= 0)
);

-- ---------------------------------------------------------------------------
-- TABLE: integrity_audits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrity_audits (
  audit_id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID             REFERENCES projects(project_id) ON DELETE SET NULL,
  database_amount   NUMERIC(18, 2)   NOT NULL,
  blockchain_amount NUMERIC(18, 2)   NOT NULL,
  difference        NUMERIC(18, 2)   GENERATED ALWAYS AS (database_amount - blockchain_amount) STORED,
  status            integrity_status NOT NULL,
  notes             JSONB,
  audited_by        UUID             REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- TABLE: complaints
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  complaint_id     UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID               REFERENCES projects(project_id) ON DELETE SET NULL,
  filed_by         UUID               REFERENCES users(user_id) ON DELETE SET NULL,
  assigned_to      UUID               REFERENCES users(user_id) ON DELETE SET NULL,
  title            TEXT               NOT NULL,
  description      TEXT               NOT NULL,
  priority         complaint_priority NOT NULL DEFAULT ''Medium'',
  status           complaint_status   NOT NULL DEFAULT ''Open'',
  resolution_notes TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT complaints_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT complaints_desc_not_empty  CHECK (char_length(trim(description)) > 0),
  CONSTRAINT complaints_resolved_check  CHECK (
    (status = ''Resolved'' AND resolved_at IS NOT NULL) OR (status <> ''Resolved'')
  )
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

-- projects
CREATE INDEX idx_projects_state           ON projects (state);
CREATE INDEX idx_projects_district        ON projects (district);
CREATE INDEX idx_projects_financial_year  ON projects (financial_year);
CREATE INDEX idx_projects_status          ON projects (status);
CREATE INDEX idx_projects_blockchain_stat ON projects (blockchain_status);
CREATE INDEX idx_projects_integrity_stat  ON projects (integrity_status);
CREATE INDEX idx_projects_imported_by     ON projects (imported_by);
CREATE INDEX idx_projects_name_trgm       ON projects USING GIN (project_name gin_trgm_ops);
CREATE INDEX idx_projects_state_year      ON projects (state, financial_year);

-- blockchain_transactions
CREATE INDEX idx_btx_project_id    ON blockchain_transactions (project_id);
CREATE INDEX idx_btx_block_number  ON blockchain_transactions (block_number);
CREATE INDEX idx_btx_status        ON blockchain_transactions (status);
CREATE INDEX idx_btx_created_at    ON blockchain_transactions (created_at DESC);
CREATE INDEX idx_btx_project_block ON blockchain_transactions (project_id, block_number DESC);

-- import_logs
CREATE INDEX idx_import_date        ON import_logs (import_date DESC);
CREATE INDEX idx_import_status      ON import_logs (status);
CREATE INDEX idx_import_imported_by ON import_logs (imported_by);
CREATE INDEX idx_import_checksum    ON import_logs (checksum_sha256);

-- integrity_audits
CREATE INDEX idx_audit_project_id ON integrity_audits (project_id);
CREATE INDEX idx_audit_status     ON integrity_audits (status);
CREATE INDEX idx_audit_created_at ON integrity_audits (created_at DESC);

-- complaints
CREATE INDEX idx_complaints_project_id  ON complaints (project_id);
CREATE INDEX idx_complaints_filed_by    ON complaints (filed_by);
CREATE INDEX idx_complaints_assigned_to ON complaints (assigned_to);
CREATE INDEX idx_complaints_status      ON complaints (status);
CREATE INDEX idx_complaints_priority    ON complaints (priority);
CREATE INDEX idx_complaints_created_at  ON complaints (created_at DESC);
CREATE INDEX idx_complaints_title_trgm  ON complaints USING GIN (title gin_trgm_ops);

-- users
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_district ON users (district);
CREATE INDEX idx_users_state    ON users (state);
CREATE INDEX idx_users_active   ON users (is_active);

-- ---------------------------------------------------------------------------
-- AUTO-UPDATE updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_complaints
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_project_summary AS
SELECT
  state,
  financial_year,
  COUNT(*)                                              AS total_projects,
  SUM(amount)                                           AS total_amount,
  COUNT(*) FILTER (WHERE status = ''Completed'')          AS completed,
  COUNT(*) FILTER (WHERE status = ''In Progress'')        AS in_progress,
  COUNT(*) FILTER (WHERE status = ''Pending'')            AS pending,
  COUNT(*) FILTER (WHERE blockchain_status = ''Verified'') AS verified_on_chain,
  COUNT(*) FILTER (WHERE integrity_status  = ''Mismatch'') AS integrity_mismatches
FROM projects
GROUP BY state, financial_year;

CREATE OR REPLACE VIEW v_blockchain_chain AS
SELECT
  bt.transaction_id,
  bt.project_id,
  p.project_code,
  p.project_name,
  bt.block_number,
  bt.hash,
  bt.previous_hash,
  bt.action,
  bt.amount,
  bt.status,
  bt.created_at
FROM blockchain_transactions bt
JOIN projects p ON p.project_id = bt.project_id
ORDER BY bt.block_number ASC;
