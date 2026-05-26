import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rfpjytvkitlczetwpyxs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Test the nested query that courses route uses
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id, title, slug,
      sections (
        id, title, sort_order,
        lessons (
          id, title, slug, sort_order, lesson_data
        )
      )
    `)
    .eq('is_published', true)
    .limit(2);

  if (error) { console.error('❌ Error:', error.message); return; }

  console.log(`✅ Got ${courses.length} courses`);
  for (const c of courses) {
    console.log(`\n📚 ${c.title}`);
    console.log(`   Sections: ${c.sections?.length ?? 0}`);
    for (const s of (c.sections || [])) {
      console.log(`   📁 ${s.title}: ${s.lessons?.length ?? 0} lessons`);
      if (s.lessons?.[0]) {
        const ld = s.lessons[0].lesson_data;
        const keys = ld ? Object.keys(ld) : [];
        console.log(`      First lesson: "${s.lessons[0].title}"`);
        console.log(`      lesson_data fields: ${keys.length} (${keys.slice(0, 5).join(', ')}...)`);
      }
    }
  }
}

main().catch(console.error);
