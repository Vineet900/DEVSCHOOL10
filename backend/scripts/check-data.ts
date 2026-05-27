import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkData() {
  console.log('📊 Checking database data...\n');

  // Check courses
  const { data: courses, error: courseErr } = await supabase.from('courses').select('*');
  console.log(`📚 Courses: ${courses?.length ?? 0} total`);
  if (courseErr) console.log('   Error:', courseErr.message);
  if (courses) {
    courses.forEach(c => {
      console.log(`   - "${c.title}" | is_published: ${c.is_published} | slug: ${c.slug}`);
    });
  }

  // Check sections
  const { data: sections, error: secErr } = await supabase.from('sections').select('*');
  console.log(`\n📂 Sections: ${sections?.length ?? 0} total`);
  if (secErr) console.log('   Error:', secErr.message);

  // Check lessons
  const { data: lessons, error: lessonErr } = await supabase.from('lessons').select('*');
  console.log(`📝 Lessons: ${lessons?.length ?? 0} total`);
  if (lessonErr) console.log('   Error:', lessonErr.message);

  // Check profiles
  const { data: profiles } = await supabase.from('profiles').select('user_id, email, role');
  console.log(`\n👤 Profiles: ${profiles?.length ?? 0} total`);
  if (profiles) {
    profiles.forEach(p => {
      console.log(`   - ${p.email} | role: ${p.role}`);
    });
  }

  // Try the exact same query that the courses route uses
  console.log('\n🔍 Testing exact courses query (with is_published filter)...');
  const { data: pubCourses, error: pubErr } = await supabase
    .from('courses')
    .select(`
      id, title, description, thumbnail, slug, created_at,
      sections (
        id, title, sort_order,
        lessons (
          id, title, content, slug, sort_order, chapter_number,
          xp_reward, duration, video_url, lesson_data
        )
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (pubErr) {
    console.log('❌ Query FAILED:', pubErr.message);
  } else {
    console.log(`✅ Published courses: ${pubCourses?.length ?? 0}`);
    if (pubCourses?.length === 0) {
      console.log('\n⚠️  No published courses! All courses have is_published = false.');
      console.log('   Fix: Run in Supabase SQL Editor:');
      console.log('   UPDATE public.courses SET is_published = true;');
    }
  }
}

checkData().catch(console.error);
