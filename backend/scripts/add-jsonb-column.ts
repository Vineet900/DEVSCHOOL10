/**
 * Add lesson_data JSONB column to lessons table
 * Usage: npx tsx scripts/add-jsonb-column.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rfpjytvkitlczetwpyxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('Adding lesson_data JSONB column...');
  
  const { error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_data JSONB DEFAULT \'{}\'::jsonb'
  });

  if (error) {
    // RPC might not exist, try direct approach
    console.log('RPC not available, column needs to be added via SQL Editor.');
    console.log('Run this SQL in Supabase Dashboard → SQL Editor:');
    console.log('');
    console.log("ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_data JSONB DEFAULT '{}'::jsonb;");
    console.log('');
  } else {
    console.log('✅ Column added!');
  }
}

main().catch(console.error);
