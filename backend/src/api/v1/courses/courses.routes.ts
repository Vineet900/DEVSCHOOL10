import { Router } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect, optionalAuth } from '../../../middleware/auth.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { sendSuccess } from '../../../utils/apiResponse.js';
import { courseRepository } from '../../../repositories/course.repository.js';
import { paginationSchema, paginate } from '../../../utils/pagination.js';
import { enrollSchema } from '../../../validators/course.validator.js';
import { NotFoundError } from '../../../utils/errors.js';
import { supabase } from '../../../lib/supabase.js';

const router = Router();

// ─── GET /api/v1/courses — Full courses with nested sections + lessons ──
// Frontend needs: courses[].sections[].lessons[] for the lessonStore
router.get('/', optionalAuth, asyncHandler(async (_req, res) => {
  // Fetch all published courses with sections and lessons nested
  const { data: courses, error } = await supabase
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

  if (error) throw error;

  // Sort sections and lessons by sort_order
  const sorted = (courses ?? []).map(course => ({
    ...course,
    sections: (course.sections ?? [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((section: any) => ({
        ...section,
        lessons: (section.lessons ?? [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      })),
  }));

  return sendSuccess(res, sorted);
}));

// ─── GET /api/v1/courses/:id — Course detail with sections ─
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const courseId = req.params['id']!;

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *, 
      sections (
        id, title, sort_order,
        lessons (
          id, title, content, slug, sort_order, chapter_number,
          xp_reward, duration, video_url, lesson_data
        )
      )
    `)
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) throw new NotFoundError('Course');

  // Sort sections and lessons
  course.sections = (course.sections ?? [])
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((section: any) => ({
      ...section,
      lessons: (section.lessons ?? [])
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));

  return sendSuccess(res, course);
}));

// ─── GET /api/v1/courses/:id/sections/:sectionId/lessons ─
router.get('/:id/sections/:sectionId/lessons', optionalAuth, asyncHandler(async (req, res) => {
  const lessons = await courseRepository.findLessonsBySection(req.params['sectionId'] as string);
  return sendSuccess(res, lessons);
}));

// ─── GET /api/v1/courses/lessons/:lessonId ────────────────
router.get('/lessons/:lessonId', optionalAuth, asyncHandler(async (req, res) => {
  const lesson = await courseRepository.findLessonById(req.params['lessonId'] as string);

  if (!lesson) throw new NotFoundError('Lesson');

  return sendSuccess(res, lesson);
}));

// ─── POST /api/v1/courses/enroll — Enroll in a course ────
router.post('/enroll', protect, validate(enrollSchema), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;

  const enrollment = await courseRepository.enroll(userId, courseId);
  return sendSuccess(res, enrollment, { statusCode: 201, message: 'Enrolled successfully' });
}));

// ─── GET /api/v1/courses/enrolled/me — User's enrollments ───
router.get('/enrolled/me', protect, asyncHandler(async (req, res) => {
  const enrollments = await courseRepository.getUserEnrollments(req.user.id);
  return sendSuccess(res, enrollments);
}));

export default router;
