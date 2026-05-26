import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('📡 Connected to Supabase PostgreSQL database.');

    const sqlPath = path.join(__dirname, 'migration_roadmaps.sql');
    console.log(`Reading SQL migration from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Running SQL migration (migration_roadmaps.sql)...');
    await client.query(sql);
    console.log('✅ Migration applied successfully.');
    
    console.log('⏳ Reloading PostgREST schema cache...');
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log('✅ Schema cache reload notification sent.');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
