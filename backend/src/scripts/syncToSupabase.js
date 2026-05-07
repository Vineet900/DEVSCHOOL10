import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentRoot = path.resolve(__dirname, '../../../frontend/src/content')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey || supabaseKey.includes('your_service_role_key')) {
  console.error('❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env')
  console.error('Please add the correct Service Role Key from Supabase settings.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncContent() {
  console.log('🚀 Starting sync from JSON files to Supabase...')

  if (!fs.existsSync(contentRoot)) {
    console.error(`❌ Content root not found: ${contentRoot}`)
    return
  }

  const modules = ['html', 'css', 'javascript']
  
  for (const moduleName of modules) {
    const folderPath = path.join(contentRoot, moduleName)
    if (!fs.existsSync(folderPath)) continue

    console.log(`\n📂 Syncing module: ${moduleName.toUpperCase()}`)

    // 1. Ensure Course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .upsert({
        title: moduleName.toUpperCase(),
        language: 'EN',
        status: 'Published',
        author: 'DevSchool AI',
      }, { onConflict: 'title' })
      .select()
      .single()

    if (courseError) {
      console.error(`❌ Error creating course ${moduleName}:`, courseError.message)
      continue
    }

    // 2. Read Lessons and Quizzes
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'))
    
    for (const fileName of files) {
      const filePath = path.join(folderPath, fileName)
      const lessonData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      
      console.log(`   - Syncing lesson: ${lessonData.title}`)
      
      const { error: lessonError } = await supabase
        .from('lessons')
        .upsert({
          slug: lessonData.slug,
          course_id: moduleName,
          title: lessonData.title,
          chapter_number: lessonData.chapterNumber,
          level: lessonData.level,
          estimated_time: lessonData.estimatedTime,
          theory: lessonData.theory || {},
          examples: lessonData.examples || [],
          exercises: lessonData.exercises || [],
          quiz: lessonData.quiz || [],
          summary: lessonData.summary || ''
        }, { onConflict: 'slug' })

      if (lessonError) {
        console.error(`     ❌ Error syncing lesson ${lessonData.slug}:`, lessonError.message)
      } else {
        console.log(`     ✅ Synced lesson ${lessonData.slug}`)
      }
      
      const quizzes = lessonData.quiz || []

      if (quizzes.length > 0) {
        for (const q of quizzes) {
          const { error: quizError } = await supabase
            .from('quizzes')
            .upsert({
              title: q.question,
              topic: moduleName.toUpperCase(),
              difficulty: 'Medium',
              status: 'Active',
              questions: 1, // simplified for list view
              data: q, // store the full quiz object in a JSONB column named 'data'
            }, { onConflict: 'title' })

          if (quizError) {
            console.error(`     ❌ Error syncing quiz:`, quizError.message)
          }
        }
      }
    }
  }

  console.log('\n✅ Sync completed!')
}

syncContent()
