import { createClient } from '@supabase/supabase-js';

/**
 * Fix missing columns in Supabase database.
 * Run: npx tsx scripts/fix-missing-columns.ts
 */

const SUPABASE_URL = 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixColumns() {
  console.log('🔧 Fixing missing columns in Supabase...\n');

  // Run SQL to add missing columns
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS chapter_number INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_data JSONB;
    `
  });

  if (error) {
    // rpc 'exec_sql' might not exist, try direct approach
    console.log('⚠️  RPC method not available, trying direct table check...\n');

    // Test if columns exist by querying
    const { data: courseData, error: courseErr } = await supabase
      .from('courses')
      .select('id, is_published')
      .limit(1);

    if (courseErr && courseErr.message.includes('is_published')) {
      console.log('❌ Column "courses.is_published" is MISSING');
      console.log('   You must add it manually in Supabase SQL Editor.\n');
    } else {
      console.log('✅ Column "courses.is_published" exists');
    }

    const { data: lessonData, error: lessonErr } = await supabase
      .from('lessons')
      .select('id, chapter_number')
      .limit(1);

    if (lessonErr && lessonErr.message.includes('chapter_number')) {
      console.log('❌ Column "lessons.chapter_number" is MISSING');
    } else {
      console.log('✅ Column "lessons.chapter_number" exists');
    }

    const { data: lessonData2, error: lessonErr2 } = await supabase
      .from('lessons')
      .select('id, lesson_data')
      .limit(1);

    if (lessonErr2 && lessonErr2.message.includes('lesson_data')) {
      console.log('❌ Column "lessons.lesson_data" is MISSING');
    } else {
      console.log('✅ Column "lessons.lesson_data" exists');
    }

    // Check what columns actually exist
    console.log('\n📋 Current courses table columns:');
    const { data: courseSample } = await supabase.from('courses').select('*').limit(1);
    if (courseSample && courseSample[0]) {
      console.log('   ', Object.keys(courseSample[0]).join(', '));
    } else {
      console.log('   (no rows or table empty)');
    }

    console.log('\n📋 Current lessons table columns:');
    const { data: lessonSample } = await supabase.from('lessons').select('*').limit(1);
    if (lessonSample && lessonSample[0]) {
      console.log('   ', Object.keys(lessonSample[0]).join(', '));
    } else {
      console.log('   (no rows or table empty)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  MANUAL FIX REQUIRED');
    console.log('='.repeat(60));
    console.log('\nGo to: Supabase Dashboard → SQL Editor → New Query');
    console.log('Paste and run:\n');
    console.log(`ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;`);
    console.log(`ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS chapter_number INTEGER NOT NULL DEFAULT 0;`);
    console.log(`ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_data JSONB;`);
    console.log('');
    return;
  }

  console.log('✅ All columns fixed successfully!');
}

fixColumns().catch(console.error);
