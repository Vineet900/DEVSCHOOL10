import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rfpjytvkitlczetwpyxs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGp5dHZraXRsY3pldHdweXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1ODI1NywiZXhwIjoyMDk1MDM0MjU3fQ.DXG0tqA0Ow2ug3lRdnmP4D7RTosNHmMAUsDNw7qi6Wk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🗑️  Deleting old data...');
  await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Old data cleared!');

  console.log('🌱 Seeding highly enhanced W3Schools-style JavaScript course...');

  // 1. Insert Course
  const courseId = crypto.randomUUID();
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      id: courseId,
      title: 'JavaScript',
      description: 'Master JavaScript from basic to advanced concepts with deep explanations and practical exercises.',
      slug: 'javascript',
      is_published: true,
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (courseErr || !course) {
    console.error(`❌ Failed to create course: ${courseErr?.message}`);
    return;
  }
  console.log(`✅ Course created: ${course.title}`);

  // 2. Sections and Lessons Data (W3Schools style)
  const sections = [
    {
      title: 'JS Basics',
      lessons: [
        {
          title: 'JS Introduction',
          chapter_number: 1,
          content: 'JavaScript is the world\'s most popular programming language.\n\nJavaScript is the programming language of the Web.\n\nJavaScript is easy to learn.\n\nThis tutorial will teach you JavaScript from basic to advanced.',
          lesson_data: {
            title: 'JS Introduction',
            chapterOverview: 'JavaScript is the world\'s most popular programming language.',
            theory: 'JavaScript is a scripting or programming language that allows you to implement complex features on web pages. Every time a web page does more than just sit there and display static information for you to look at — displaying timely content updates, interactive maps, animated 2D/3D graphics, scrolling video jukeboxes, etc. — you can bet that JavaScript is probably involved.',
            examples: [
              {
                title: 'Change HTML Content',
                code: 'document.getElementById("demo").innerHTML = "Hello JavaScript!";',
                explanation: 'One of many JavaScript HTML methods is getElementById(). The example uses the method to "find" an HTML element (with id="demo") and changes the element content (innerHTML) to "Hello JavaScript!".'
              }
            ],
            practiceTasks: [
              {
                task: 'Use JavaScript to change the content of an HTML element with id="test" to "I am learning JS!".',
                solution: 'document.getElementById("test").innerHTML = "I am learning JS!";'
              }
            ],
            interviewQuestions: [
              {
                question: 'What is JavaScript?',
                answer: 'JavaScript is a lightweight, cross-platform, object-oriented computer programming language used to make web pages interactive.'
              }
            ]
          }
        },
        {
          title: 'JS Variables',
          chapter_number: 2,
          content: 'Variables are containers for storing data values.',
          lesson_data: {
            title: 'JS Variables',
            chapterOverview: 'Variables are containers for storing data values.',
            theory: 'In JavaScript, there are 3 ways to declare variables: \n1. var\n2. let\n3. const\n\nAlways use const if the value should not be changed. Always use let if you can\'t use const. Only use var if you MUST support old browsers.',
            examples: [
              {
                title: 'Declaring Variables',
                code: 'let x = 5;\nlet y = 6;\nlet z = x + y;',
                explanation: 'In this example, x, y, and z are variables, declared with the let keyword. x stores the value 5. y stores the value 6. z stores the sum of x and y.'
              }
            ],
            practiceTasks: [
              {
                task: 'Create a variable named carName and assign the value "Volvo" to it.',
                solution: 'let carName = "Volvo";'
              }
            ],
            interviewQuestions: [
              {
                question: 'What is the difference between let and var?',
                answer: 'let is block-scoped, while var is function-scoped. let does not allow redeclaration within the same scope, whereas var does.'
              }
            ]
          }
        }
      ]
    },
    {
      title: 'JS Functions',
      lessons: [
        {
          title: 'JS Function Basics',
          chapter_number: 3,
          content: 'A JavaScript function is a block of code designed to perform a particular task.',
          lesson_data: {
            title: 'JS Function Basics',
            chapterOverview: 'A JavaScript function is a block of code designed to perform a particular task.',
            theory: 'A JavaScript function is executed when "something" invokes it (calls it).\n\nSyntax:\nA JavaScript function is defined with the function keyword, followed by a name, followed by parentheses ().\nFunction names can contain letters, digits, underscores, and dollar signs (same rules as variables).',
            examples: [
              {
                title: 'Basic Function',
                code: 'function myFunction(p1, p2) {\n  return p1 * p2;\n}',
                explanation: 'This function takes two parameters (p1 and p2) and returns their product.'
              }
            ],
            practiceTasks: [
              {
                task: 'Write a function named greet that returns "Hello World!".',
                solution: 'function greet() {\n  return "Hello World!";\n}'
              }
            ],
            interviewQuestions: [
              {
                question: 'What is a function return?',
                answer: 'When JavaScript reaches a return statement, the function will stop executing and return the specified value to the caller.'
              }
            ]
          }
        }
      ]
    }
  ];

  // 3. Insert Sections and Lessons
  let sort_order_section = 0;
  for (const sectionData of sections) {
    const sectionId = crypto.randomUUID();
    const { data: section, error: secErr } = await supabase
      .from('sections')
      .insert({
        id: sectionId,
        course_id: course.id,
        title: sectionData.title,
        sort_order: sort_order_section++
      })
      .select()
      .single();

    if (secErr || !section) {
      console.error(`❌ Section "${sectionData.title}" failed: ${secErr?.message}`);
      continue;
    }

    const lessonPayloads = sectionData.lessons.map((lesson, idx) => ({
      id: crypto.randomUUID(),
      section_id: section.id,
      course_id: course.id,
      title: lesson.title,
      content: lesson.content,
      lesson_data: lesson.lesson_data,
      chapter_number: lesson.chapter_number,
      sort_order: idx,
      xp_reward: 20,
      duration: 30, // 30 minutes
      slug: lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }));

    const { error: lessonErr } = await supabase.from('lessons').insert(lessonPayloads);
    if (lessonErr) {
      console.error(`❌ Lessons for "${sectionData.title}" failed: ${lessonErr.message}`);
    } else {
      console.log(`   📚 Section "${sectionData.title}": ${lessonPayloads.length} lessons inserted`);
    }
  }

  console.log('\n🎉 JavaScript Course seeded successfully in W3Schools style!');
}

main().catch(console.error);
