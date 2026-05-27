import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function publishCourses() {
  const { data, error } = await supabase
    .from('courses')
    .update({ is_published: true })
    .eq('is_published', false)
    .select('id, title');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Published ${data.length} courses:`);
  data.forEach(c => console.log(`   - ${c.title}`));
}

publishCourses().catch(console.error);
