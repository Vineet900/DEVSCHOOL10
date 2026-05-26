import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Client } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env file');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Successfully connected to the database.');

    // 1. Add ai_tokens column to public.profiles if not exists
    console.log('Adding column "ai_tokens" to "profiles" table if it doesn\'t exist...');
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS ai_tokens INTEGER DEFAULT 50 CHECK (ai_tokens >= 0);
    `);
    console.log('Column "ai_tokens" successfully checked/added.');

    // 2. Also ensure all existing profiles have at least 50 tokens
    console.log('Updating existing users to have 50 tokens if their ai_tokens is null or less than 50...');
    await client.query(`
      UPDATE public.profiles
      SET ai_tokens = COALESCE(ai_tokens, 50)
      WHERE ai_tokens IS NULL OR ai_tokens < 50;
    `);
    console.log('Existing users updated.');

  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

run();
