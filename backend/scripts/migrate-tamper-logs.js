import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(`
    ALTER TABLE tamper_logs
      ADD COLUMN IF NOT EXISTS bid_id TEXT,
      ADD COLUMN IF NOT EXISTS tender_id TEXT,
      ADD COLUMN IF NOT EXISTS trusted_hash TEXT,
      ADD COLUMN IF NOT EXISTS current_hash TEXT,
      ADD COLUMN IF NOT EXISTS original_amount TEXT,
      ADD COLUMN IF NOT EXISTS current_amount TEXT,
      ADD COLUMN IF NOT EXISTS vendor_name TEXT,
      ADD COLUMN IF NOT EXISTS vendor_id TEXT;
  `);
  console.log('Migration done');
} catch(e) {
  console.error(e.message);
  process.exit(1);
} finally {
  await pool.end();
}
