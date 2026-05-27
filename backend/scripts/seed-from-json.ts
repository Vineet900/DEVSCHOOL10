import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

// ─── Supabase Connection ──────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Paths ────────────────────────────────────────────────
// The user provided courses (2).zip which we extracted to this folder
const COURSES_DIR = 'c:\\Users\\vroy1\\Downloads\\v2.4\\courses_extracted\\courses';
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

// ─── Helper: Clean Title ──────────────────────────────────
function cleanTitle(text: string): string {
  return text
    .replace('.zip', '')
    .replace(/premium/i, '')
    .replace(/master/i, '')
    .replace(/course/i, '')
    .replace(/bundle/i, '')
    .replace(/roadmap/i, '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findZips(dir: string): string[] {
  const zips: string[] = [];
  if (!fs.existsSync(dir)) return zips;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      zips.push(...findZips(fullPath));
    } else if (item.name.endsWith('.zip')) {
      zips.push(fullPath);
    }
  }
  return zips;
}

function unzip(zipPath: string, destDir: string): void {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
    { timeout: 60000 }
  );
}

function findJsonFiles(dir: string): string[] {
  const jsons: string[] = [];
  if (!fs.existsSync(dir)) return jsons;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      jsons.push(...findJsonFiles(fullPath));
    } else if (item.name.endsWith('.json')) {
      jsons.push(fullPath);
    }
  }
  return jsons.sort();
}

function parseDuration(time?: string): number {
  if (!time) return 30;
  const match = time.match(/(\d+)/);
  if (match) return parseInt(match[1]!) * 60;
  return 30;
}

// ─── Process a single ZIP → Course + Lessons ─────────────
async function processZip(zipPath: string, globalIndex: number): Promise<void> {
  const zipName = path.basename(zipPath);
  const courseTitle = cleanTitle(zipName);
  
  if (!courseTitle) {
      console.log(`   ⏭️  Skipping invalid title from ${zipName}`);
      return;
  }
  
  const courseSlug = slugify(courseTitle);
  const extractDir = path.join(TEMP_DIR, courseSlug);

  console.log(`\n📦 [${globalIndex}] Processing: ${courseTitle}`);

  // Delete existing if any (to ensure fresh clean data)
  await supabase.from('courses').delete().eq('slug', courseSlug);

  try {
    unzip(zipPath, extractDir);
  } catch (err) {
    console.error(`   ❌ Failed to unzip: ${(err as Error).message}`);
    return;
  }

  const jsonFiles = findJsonFiles(extractDir);
  console.log(`   📄 Found ${jsonFiles.length} lesson files`);

  if (jsonFiles.length === 0) {
    console.log(`   ⚠️  No JSON lessons found — skipping`);
    return;
  }

  // Determine thumbnail
  let thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png';
  if (courseTitle.toLowerCase().includes('react')) thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg';
  if (courseTitle.toLowerCase().includes('css')) thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/6/62/CSS3_logo.svg';
  if (courseTitle.toLowerCase().includes('html')) thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg';

  // 1. Insert Course
  const courseId = crypto.randomUUID();
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      id: courseId,
      title: courseTitle,
      description: `Complete ${courseTitle} course with detailed explanations, examples, and exercises.`,
      slug: courseSlug,
      is_published: true,
      thumbnail: thumbnail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (courseErr || !course) {
    console.error(`   ❌ Failed to create course: ${courseErr?.message}`);
    return;
  }
  console.log(`   ✅ Course created: ${course.title}`);

  // Group lessons by folder
  const sections: Record<string, string[]> = {};
  for (const jsonPath of jsonFiles) {
    const relative = path.relative(extractDir, jsonPath);
    const parts = relative.split(path.sep);
    
    let sectionName = 'Lessons';
    if (parts.length >= 2) {
      // Use the immediate parent folder name as the section name
      sectionName = cleanTitle(parts[parts.length - 2]);
    }
    
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(jsonPath);
  }

  // 2. Insert Sections and Lessons
  let sort_order_section = 0;
  for (const [sectionTitle, files] of Object.entries(sections)) {
    const sectionId = crypto.randomUUID();
    const { data: section, error: secErr } = await supabase
      .from('sections')
      .insert({
        id: sectionId,
        course_id: course.id,
        title: sectionTitle || 'Main Course',
        sort_order: sort_order_section++,
        // Omit created_at to avoid schema cache error
      })
      .select()
      .single();

    if (secErr || !section) {
      console.error(`   ❌ Section "${sectionTitle}" failed: ${secErr?.message}`);
      continue;
    }

    const lessonPayloads = files.map((filePath, idx) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      let lesson;
      try {
        lesson = JSON.parse(raw);
      } catch {
        console.error(`   ⚠️  Invalid JSON: ${path.basename(filePath)}`);
        return null;
      }

      return {
        id: crypto.randomUUID(),
        section_id: section.id,
        title: String(lesson['title'] ?? path.basename(filePath, '.json')),
        content: String(lesson['chapterOverview'] ?? lesson['summary'] ?? ''),
        lesson_data: lesson,
        chapter_number: (lesson['chapterNumber'] as number) ?? idx + 1,
        sort_order: idx,
        xp_reward: 10,
        duration: parseDuration(lesson['estimatedTime'] as string),
        slug: slugify(String(lesson['title'] ?? path.basename(filePath, '.json'))),
        // Omit created_at to avoid schema cache error
      };
    }).filter(Boolean);

    // Batch insert
    for (let i = 0; i < lessonPayloads.length; i += 20) {
      const batch = lessonPayloads.slice(i, i + 20);
      const { error: lessonErr } = await supabase.from('lessons').insert(batch);
      if (lessonErr) {
        console.error(`   ❌ Lesson batch insert failed: ${lessonErr.message}`);
      }
    }
    console.log(`   📚 Section "${sectionTitle}": ${lessonPayloads.length} lessons inserted`);
  }
}

async function main() {
  console.log('🌱 DevSchool Advanced JSON Seeder');
  console.log('='.repeat(50));

  console.log('🗑️  Deleting all old data first...');
  await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Old data cleared!');

  const zips = findZips(COURSES_DIR);
  console.log(`\n📂 Found ${zips.length} course ZIP files in ${COURSES_DIR}`);

  if (zips.length === 0) {
    console.log('❌ No ZIP files found. Check the path.');
    process.exit(1);
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Find javascript course and run it first (or run all)
  // We will run ALL of them as requested ("tum ek ek krke krskte ho", this script does them sequentially)
  let success = 0;
  let failed = 0;

  for (let i = 0; i < zips.length; i++) {
    try {
      await processZip(zips[i]!, i + 1);
      success++;
    } catch (err) {
      console.error(`❌ Failed: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log('\n🧹 Cleaning up temp files...');
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done! ${success} courses processed, ${failed} failed.`);
}

main().catch(console.error);
