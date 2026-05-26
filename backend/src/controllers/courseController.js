import { supabase } from '../database/supabase.js';
import { createCourseSchema, updateCourseSchema } from '../validations/courseValidation.js';

/**
 * @desc    Get all courses (public/published) with sections and lessons
 * @route   GET /api/courses
 */
export const getCourses = async (req, res, next) => {
  try {
    const { data: courses, error: courseErr } = await supabase
      .from('courses')
      .select(`
        *,
        lessons (
          *
        ),
        sections (
          id, title, sort_order,
          lessons (
            *
          )
        )
      `)
      .order('created_at', { ascending: true });

    if (courseErr) throw courseErr;

    // Sort sections and lessons by sort_order
    const normalized = (courses || []).map(course => ({
      ...course,
      lessons: (course.lessons || [])
        .sort((a, b) => (a.sort_order || a.chapter_number || 0) - (b.sort_order || b.chapter_number || 0)),
      sections: (course.sections || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(section => ({
          ...section,
          lessons: (section.lessons || []).sort((a, b) => (a.sort_order || a.chapter_number || 0) - (b.sort_order || b.chapter_number || 0))
        }))
    }));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single course with full content
 * @route   GET /api/courses/:id
 */
export const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        lessons (
          *
        ),
        sections (
          id, title, sort_order,
          lessons (
            *
          )
        )
      `)
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const normalized = {
      ...course,
      lessons: (course.lessons || [])
        .sort((a, b) => (a.sort_order || a.chapter_number || 0) - (b.sort_order || b.chapter_number || 0)),
      sections: (course.sections || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(section => ({
          ...section,
          lessons: (section.lessons || []).sort((a, b) => (a.sort_order || a.chapter_number || 0) - (b.sort_order || b.chapter_number || 0))
        }))
    };

    res.status(200).json({ success: true, data: normalized });
  } catch (err) {
    next(err);
  }
};




/**
 * @desc    Create new course (Admin/Instructor Only)
 * @route   POST /api/courses
 */
export const createCourse = async (req, res, next) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);

    const { data: course, error } = await supabase
      .from('courses')
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update course (Admin/Instructor Only)
 * @route   PUT /api/courses/:id
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateCourseSchema.parse(req.body);

    const { data: course, error } = await supabase
      .from('courses')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};
/**
 * @desc    Get personalized daily learning plan
 * @route   GET /api/courses/daily-plan
 */
export const getDailyPlan = async (req, res, next) => {
  try {
    const { level = 'beginner' } = req.query;

    const { data: courses } = await supabase.from('courses').select('*').limit(5);
    const { data: lessons } = await supabase.from('lessons').select('*').limit(100);

    // Manual join
    const allLessons = lessons.filter(l => 
        l.level?.toLowerCase() === level.toLowerCase()
    );
    
    const randomLesson = allLessons.length > 0 
        ? allLessons[Math.floor(Math.random() * allLessons.length)]
        : lessons[0];

    res.status(200).json({
      success: true,
      data: {
        lesson: randomLesson?.title || 'Explore new horizons',
        exercise: `Practice ${randomLesson?.title || 'coding'} fundamentals`,
        quiz: `Take the ${randomLesson?.title || 'module'} assessment`,
        miniProject: `Build a mini project using ${randomLesson?.title || 'these skills'}`,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Delete course (Admin Only)
 * @route   DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
