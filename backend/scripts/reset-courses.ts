/**
 * Step 1: Add lesson_data JSONB column + clear old data
 * Usage: npx tsx scripts/reset-courses.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rfpjytvkitlczetwpyxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('🗑️  Deleting old lessons...');
  await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('🗑️  Deleting old sections...');
  await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('🗑️  Deleting old courses...');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✅ All courses cleared!');

  // Verify
  const { count: c } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  const { count: l } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
  console.log(`📊 Remaining: ${c} courses, ${l} lessons`);
}

main().catch(console.error);
