import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addCourseId() {
  console.log('🔧 Adding course_id to lessons table...');

  // Using the RPC method 'exec_sql' if it exists. If not, we can't alter tables from JS client directly.
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;`
  });

  if (error) {
    console.log('❌ RPC failed:', error.message);
    console.log('\n⚠️ PLEASE RUN THIS IN SUPABASE SQL EDITOR:');
    console.log('ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;');
  } else {
    console.log('✅ Added course_id to lessons table!');
  }
}

addCourseId().catch(console.error);
