export const languages = ['en', 'hi', 'hinglish']
export const learningLevels = ['beginner', 'intermediate', 'advanced', 'expert']

export const categories = {
  en: ['Frontend', 'Backend', 'Database', 'Advanced'],
  hi: ['Frontend', 'Backend', 'Database', 'Advanced'],
  hinglish: ['Frontend', 'Backend', 'Database', 'Advanced'],
}

export const courses = [
  fullCourse('html', 'HTML', 'Frontend', [
    'Introduction',
    'Basic Tags',
    'Headings',
    'Paragraphs',
    'Links',
    'Images',
    'Lists',
    'Tables',
    'Forms',
    'Semantic HTML',
  ]),
  miniCourse('css', 'CSS', 'Frontend'),
  miniCourse('javascript', 'JavaScript', 'Frontend'),
  miniCourse('react', 'React', 'Frontend'),
  miniCourse('tailwind', 'Tailwind', 'Frontend'),
  miniCourse('node-js', 'Node.js', 'Backend'),
  miniCourse('express', 'Express', 'Backend'),
  miniCourse('apis', 'APIs', 'Backend'),
  miniCourse('mongodb', 'MongoDB', 'Database'),
  miniCourse('sql', 'SQL', 'Database'),
  miniCourse('full-stack-projects', 'Full Stack Projects', 'Advanced'),
  miniCourse('github', 'GitHub', 'Advanced'),
  miniCourse('deployment', 'Deployment', 'Advanced'),
  miniCourse('interview-prep', 'Interview Prep', 'Advanced'),
]

export const popularCourseIds = ['html', 'css', 'javascript', 'react']

export const dailyChallenge = {
  en: { title: 'Daily Challenge', description: 'Build a responsive profile card with clean semantic HTML.' },
  hi: { title: 'Daily Challenge', description: 'Clean semantic HTML ka use karke responsive profile card banao.' },
  hinglish: { title: 'Daily Challenge', description: 'Semantic HTML use karke responsive profile card build karo.' },
}

export const projectsByLevel = {
  beginner: ['Resume page', 'Portfolio'],
  intermediate: ['Todo app', 'Calculator'],
  advanced: ['Ecommerce', 'Blog', 'Chat app'],
}

export const courseQuizzes = {
  html: [
    quiz('html-q1', {
      en: 'Which tag is best for the main page heading?',
      hi: 'Main page heading ke liye kaunsa tag best hai?',
      hinglish: 'Main page heading ke liye kaunsa tag best rahega?',
    }, ['h1', 'p', 'strong', 'div'], 0),
  ],
  css: [
    quiz('css-q1', {
      en: 'Which layout module is one-dimensional?',
      hi: 'Kaunsa layout module one-dimensional hai?',
      hinglish: 'Kaunsa layout module one-dimensional hota hai?',
    }, ['Grid', 'Flexbox', 'Float', 'Table'], 1),
  ],
  javascript: [
    quiz('js-q1', {
      en: 'Which method returns a new array by transforming items?',
      hi: 'Kaunsa method items ko transform karke new array deta hai?',
      hinglish: 'Kaunsa method transform karke new array return karta hai?',
    }, ['forEach', 'map', 'reduce', 'find'], 1),
  ],
  react: [
    quiz('react-q1', {
      en: 'Which hook stores local component state?',
      hi: 'Kaunsa hook local component state store karta hai?',
      hinglish: 'Kaunsa hook local component state store karta hai?',
    }, ['useRef', 'useMemo', 'useState', 'useContext'], 2),
  ],
}

export const exerciseTemplates = [
  {
    id: 'fill',
    prompt: {
      en: 'Complete this anchor tag: `<a ___="https://example.com">Visit</a>`',
      hi: 'Is anchor tag ko complete karo: `<a ___="https://example.com">Visit</a>`',
      hinglish: 'Anchor tag complete karo: `<a ___="https://example.com">Visit</a>`',
    },
    answer: 'href',
  },
  {
    id: 'fix',
    prompt: {
      en: 'Fix this code: `<h1>Title</h2>`',
      hi: 'Is code ko fix karo: `<h1>Title</h2>`',
      hinglish: 'Is code ko sahi karo: `<h1>Title</h2>`',
    },
    answer: '<h1>Title</h1>',
  },
]

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId)
}

export function searchTopics(query, language = 'en') {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return courses.flatMap((course) =>
    course.chapters
      .filter((chapterData) => {
        const content = [
          course.title[language],
          chapterData.title[language],
          chapterData.levels.beginner.explanation[language],
        ]
          .join(' ')
          .toLowerCase()
        return content.includes(q)
      })
      .map((chapterData) => ({
        courseId: course.id,
        courseTitle: course.title[language],
        chapterId: chapterData.id,
        chapterTitle: chapterData.title[language],
      })),
  )
}

function fullCourse(id, title, category, chapterNames) {
  return {
    id,
    title: tri(title, title, title),
    category,
    description: tri(
      `${title} ko beginner se expert level tak practical examples ke saath sikho.`,
      `${title} ko beginner se expert level tak practical examples ke saath sikho.`,
      `${title} ko beginner se expert level tak practical examples ke saath sikho.`,
    ),
    chapters: chapterNames.map((name, index) => chapter(slug(name), name, `${title} topic ${index + 1}`)),
  }
}

function miniCourse(id, title, category) {
  return fullCourse(id, title, category, ['Introduction', 'Core Syntax', 'Best Practices'])
}

function chapter(id, label, topic) {
  return {
    id,
    title: tri(label, label, label),
    syntaxExample: `<section>\n  <h2>${label}</h2>\n  <p>Practice ${topic} with DevSchool Pro.</p>\n</section>`,
    levels: {
      beginner: level(topic, 'beginner'),
      intermediate: level(topic, 'intermediate'),
      advanced: level(topic, 'advanced'),
      expert: level(topic, 'expert'),
    },
  }
}

function level(topic, stage) {
  return {
    explanation: tri(
      `${capitalize(stage)}: Learn ${topic} with clear concepts and intuition.`,
      `${capitalize(stage)}: ${topic} ko clear concept aur intuition ke saath samjho.`,
      `${capitalize(stage)}: ${topic} ko simple language me deep samjho.`,
    ),
    example: tri(
      `Example for ${topic} at ${stage} level with practical coding.`,
      `${topic} ka ${stage} level practical coding example.`,
      `${topic} ka ${stage} level practical example.`,
    ),
    useCase: tri(
      `Real use case: apply ${topic} in production UI or API flow.`,
      `Real use case: ${topic} ko production UI ya API flow me use karo.`,
      `Real use case: ${topic} ko production project me apply karo.`,
    ),
    wrongVsRight: tri(
      `Wrong vs Right: avoid anti-patterns and choose maintainable ${topic} design.`,
      `Wrong vs Right: anti-patterns avoid karo aur maintainable ${topic} design choose karo.`,
      `Wrong vs Right: galat pattern avoid karo aur clean ${topic} approach lo.`,
    ),
    practice: tri(
      `Practice: solve one focused coding task on ${topic}.`,
      `Practice: ${topic} par ek focused coding task solve karo.`,
      `Practice: ${topic} par ek practical task complete karo.`,
    ),
    summary: tri(
      `Summary: ${topic} is now clear from basics to advanced perspective.`,
      `Summary: ${topic} ab basics se advanced tak clear hai.`,
      `Summary: ${topic} ka end-to-end concept clear ho gaya.`,
    ),
    interviewTips: tri(
      `Interview tip: explain trade-offs and real project decisions for ${topic}.`,
      `Interview tip: ${topic} ke trade-offs aur real project decisions explain karo.`,
      `Interview tip: ${topic} ka why + how confidently explain karo.`,
    ),
  }
}

function quiz(id, question, options, answer) {
  return {
    id,
    question,
    options,
    answer,
    explanation: {
      en: `Correct answer: ${options[answer]}.`,
      hi: `Sahi answer: ${options[answer]}.`,
      hinglish: `Correct answer: ${options[answer]}.`,
    },
  }
}

function tri(en, hi, hinglish) {
  return { en, hi, hinglish }
}

function slug(value) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
