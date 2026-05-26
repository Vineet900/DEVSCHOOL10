/**
 * ============================================================
 * DevSchool Pro — Course Seeder Script
 * ============================================================
 * Reads all course ZIP files → Unzips → Parses JSON lessons →
 * Inserts courses + sections + lessons into Supabase.
 *
 * Usage: npx tsx scripts/seed-courses.ts
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Supabase Connection ──────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Paths ────────────────────────────────────────────────
const COURSES_DIR = 'c:\\Users\\vroy1\\Downloads\\courses';
const TEMP_DIR = path.join(process.cwd(), 'temp_seed');

// ─── Helper: Slugify ──────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Helper: Title from zip name ──────────────────────────
function zipToTitle(zipName: string): string {
  return zipName
    .replace('.zip', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Find all zip files recursively ───────────────────────
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

// ─── Unzip a file ─────────────────────────────────────────
function unzip(zipPath: string, destDir: string): void {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
    { timeout: 30000 }
  );
}

// ─── Find JSON lesson files in extracted folder ───────────
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
  // Sort by filename (001-, 002-, etc.)
  return jsons.sort();
}

// ─── Process a single ZIP → Course + Lessons ─────────────
async function processZip(zipPath: string, globalIndex: number): Promise<void> {
  const zipName = path.basename(zipPath);
  const courseTitle = zipToTitle(zipName);
  const courseSlug = slugify(courseTitle);
  const extractDir = path.join(TEMP_DIR, courseSlug);

  console.log(`\n📦 [${globalIndex}] Processing: ${courseTitle}`);
  console.log(`   ZIP: ${zipPath}`);

  // Check if course already exists
  const { data: existing } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .maybeSingle();

  if (existing) {
    console.log(`   ⏭️  Already exists — skipping`);
    return;
  }

  // Unzip
  try {
    unzip(zipPath, extractDir);
  } catch (err) {
    console.error(`   ❌ Failed to unzip: ${(err as Error).message}`);
    return;
  }

  // Find all JSON lesson files
  const jsonFiles = findJsonFiles(extractDir);
  console.log(`   📄 Found ${jsonFiles.length} lesson files`);

  if (jsonFiles.length === 0) {
    console.log(`   ⚠️  No JSON lessons found — skipping`);
    return;
  }

  // Read README for description
  let description = `Complete ${courseTitle} course with ${jsonFiles.length} lessons.`;
  const readmePath = findFile(extractDir, 'README.txt') || findFile(extractDir, 'README.md');
  if (readmePath) {
    description = fs.readFileSync(readmePath, 'utf-8').trim();
  }

  // 1. Insert Course
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      title: courseTitle,
      description,
      slug: courseSlug,
      is_published: true,
    })
    .select()
    .single();

  if (courseErr || !course) {
    console.error(`   ❌ Failed to create course: ${courseErr?.message}`);
    return;
  }
  console.log(`   ✅ Course created: ${course.id}`);

  // 2. Detect sections (sub-folders = sections, or use single default)
  const sectionMap = detectSections(extractDir, jsonFiles);

  for (const [sectionTitle, sectionFiles] of Object.entries(sectionMap)) {
    // Insert section
    const { data: section, error: secErr } = await supabase
      .from('sections')
      .insert({
        course_id: course.id,
        title: sectionTitle,
        sort_order: Object.keys(sectionMap).indexOf(sectionTitle),
      })
      .select()
      .single();

    if (secErr || !section) {
      console.error(`   ❌ Section "${sectionTitle}" failed: ${secErr?.message}`);
      continue;
    }

    // 3. Insert Lessons (batch of 20 at a time)
    const lessonPayloads = sectionFiles.map((filePath, idx) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      let lesson: Record<string, unknown>;
      try {
        lesson = JSON.parse(raw);
      } catch {
        console.error(`   ⚠️  Invalid JSON: ${path.basename(filePath)}`);
        return null;
      }

      // Store FULL original JSON as-is in lesson_data JSONB column
      // This preserves ALL fields: theory, examples, practiceTasks,
      // interviewQuestions, debuggingExamples, miniProjects, etc.
      return {
        section_id: section.id,
        course_id: course.id,
        title: String(lesson['title'] ?? path.basename(filePath, '.json')),
        content: String(lesson['chapterOverview'] ?? lesson['summary'] ?? ''),
        lesson_data: lesson,  // ← FULL ORIGINAL JSON — nothing lost
        chapter_number: (lesson['chapterNumber'] as number) ?? idx + 1,
        sort_order: idx,
        xp_reward: 10,
        duration: parseDuration(lesson['estimatedTime'] as string),
        slug: slugify(String(lesson['title'] ?? path.basename(filePath, '.json'))),
      };
    }).filter(Boolean);

    // Batch insert in chunks of 20
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

// ─── Helpers ──────────────────────────────────────────────
function findFile(dir: string, name: string): string | null {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isFile() && item.name.toLowerCase() === name.toLowerCase()) return full;
    if (item.isDirectory()) {
      const found = findFile(full, name);
      if (found) return found;
    }
  }
  return null;
}

function detectSections(
  extractDir: string,
  allJsonFiles: string[]
): Record<string, string[]> {
  // Check if there are sub-directories with JSON files
  const subdirs = fs.readdirSync(extractDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  // If we have named subdirs (e.g. "html", "css"), use them as sections
  // Otherwise check nested dirs
  const sections: Record<string, string[]> = {};

  // Walk through and group by parent directory
  for (const jsonPath of allJsonFiles) {
    const relative = path.relative(extractDir, jsonPath);
    const parts = relative.split(path.sep);

    let sectionName: string;
    if (parts.length >= 3) {
      // e.g., "course_name/subject/001-lesson.json" → subject is section
      sectionName = parts[parts.length - 2]!
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    } else if (parts.length === 2) {
      // e.g., "subject/001-lesson.json" → subject is section
      sectionName = parts[0]!
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    } else {
      sectionName = 'Lessons';
    }

    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(jsonPath);
  }

  // Sort files in each section
  for (const key of Object.keys(sections)) {
    sections[key]!.sort();
  }

  return sections;
}

function parseDuration(time?: string): number {
  if (!time) return 30;
  // "4-8 Hours" → avg = 6 * 60 = 360 minutes
  const match = time.match(/(\d+)/);
  if (match) return parseInt(match[1]!) * 60;
  return 30;
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
  console.log('🌱 DevSchool Course Seeder');
  console.log('='.repeat(50));

  // Find all ZIP files
  const zips = findZips(COURSES_DIR);
  console.log(`\n📂 Found ${zips.length} course ZIP files in ${COURSES_DIR}`);

  if (zips.length === 0) {
    console.log('❌ No ZIP files found. Check the path.');
    process.exit(1);
  }

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Process each zip
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

  // Cleanup temp directory
  console.log('\n🧹 Cleaning up temp files...');
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }

  // Also clean the temp_course from earlier
  const earlyTemp = path.join(process.cwd(), 'temp_course');
  if (fs.existsSync(earlyTemp)) {
    fs.rmSync(earlyTemp, { recursive: true });
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done! ${success} courses processed, ${failed} failed.`);

  // Verify
  const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true });
  const { count: lessonCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
  console.log(`📊 Total in DB: ${count} courses, ${lessonCount} lessons`);
}

main().catch(console.error);
