import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rfpjytvkitlczetwpyxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Get one lesson and check lesson_data
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, lesson_data')
    .limit(1)
    .single();

  if (error) { console.error(error); return; }

  console.log('📄 Lesson:', data.title);
  console.log('');

  const ld = data.lesson_data as Record<string, unknown>;
  const keys = Object.keys(ld);
  console.log(`✅ lesson_data has ${keys.length} fields:`);
  keys.forEach(k => {
    const val = ld[k];
    const type = Array.isArray(val) ? `Array(${(val as unknown[]).length})` : typeof val;
    console.log(`   • ${k}: ${type}`);
  });
}

main().catch(console.error);
