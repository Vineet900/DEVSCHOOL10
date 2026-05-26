import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Client } = pg;

async function test() {
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

    // Fetch the profiles table description or some users
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles';
    `);
    
    console.log('Profiles table columns:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    const profiles = await client.query(`
      SELECT username, ai_tokens FROM public.profiles LIMIT 5;
    `);
    
    console.log('\nUsers and their AI Token balance:');
    profiles.rows.forEach(p => {
      console.log(`- ${p.username}: ${p.ai_tokens} tokens`);
    });

  } catch (error) {
    console.error('Error executing query:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

test();
