import { pool } from './db.js';

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      amount NUMERIC(18,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      blockchain_status TEXT NOT NULL DEFAULT 'Pending',
      blockchain_hash TEXT,
      integrity_status TEXT NOT NULL DEFAULT 'Review Required',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blockchain_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      tx_hash TEXT NOT NULL UNIQUE,
      action TEXT NOT NULL,
      amount NUMERIC(18,2) NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS integrity_audits (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      database_amount NUMERIC(18,2) NOT NULL,
      blockchain_amount NUMERIC(18,2) NOT NULL,
      difference NUMERIC(18,2) NOT NULL,
      status TEXT NOT NULL,
      notes JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS import_logs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      total_records INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Success',
      error_details JSONB,
      checksum TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      district TEXT,
      state TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      filed_by TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      resolution_notes TEXT,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
    CREATE INDEX IF NOT EXISTS idx_projects_district ON projects(district);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_blockchain_project ON blockchain_records(project_id);
    CREATE INDEX IF NOT EXISTS idx_audit_project ON integrity_audits(project_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_project ON complaints(project_id);
  `);

  console.log('DB tables ready');
}