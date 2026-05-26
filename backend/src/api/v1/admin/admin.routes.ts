import { Router } from 'express';
import os from 'os';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { authorize } from '../../../middleware/rbac.middleware.js';
import { validate } from '../../../middleware/validate.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { paginationSchema, paginate, getRange } from '../../../utils/pagination.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { courseRepository } from '../../../repositories/course.repository.js';
import { settingsService } from '../../../services/settings.service.js';
import { tokenService } from '../../../services/ai/token.service.js';
import {
  updateUserSchema, banUserSchema, createCourseSchema, updateCourseSchema,
  createSectionSchema, updateSectionSchema, bulkSectionsSchema,
  createLessonSchema, updateLessonSchema, createQuizSchema,
  updateSettingsSchema, bulkSettingsSchema,
  sendNotificationSchema, updateRedeemSchema,
  resolveModerationSchema, deleteFlaggedContentSchema,
  refillTokensSchema,
} from '../../../validators/admin.validator.js';
import { supabase } from '../../../lib/supabase.js';

const router = Router();

// All admin routes require auth + ADMIN role
router.use(protect);
router.use(authorize('ADMIN'));

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // DB-level aggregations — no full table scans
  const [counts, activeUsers, recentUsers, pendingRedeems, pendingReports] = await Promise.all([
    userRepository.getDashboardCounts(),
    userRepository.getActiveUsersCount(oneDayAgo),
    userRepository.getRecentUsers(5),
    supabase.from('redeem_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('moderation_reports').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
  ]);

  return sendSuccess(res, {
    ...counts,
    activeUsers,
    recentUsers,
    pendingRedeems: pendingRedeems.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
  });
}));

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT (FIX #2: Mass Assignment)
// ═══════════════════════════════════════════════════════════

router.get('/users', validate(paginationSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' };
  const { data, total } = await userRepository.findAll(query);
  const result = paginate(data, total, query);
  return sendSuccess(res, result.data, { meta: result.meta });
}));

// FIX #2: Only whitelisted fields allowed — Zod strips everything else
router.put('/users/:id', validate(updateUserSchema), asyncHandler(async (req, res) => {
  // req.body is now validated and stripped by Zod — no mass assignment possible
  const data = await userRepository.updateProfile(req.params['id']!, req.body);
  return sendSuccess(res, data, { message: 'User updated' });
}));

router.put('/users/:id/ban', validate(banUserSchema), asyncHandler(async (req, res) => {
  const data = await userRepository.banUser(req.params['id']!, req.body.banned);
  return sendSuccess(res, data, { message: `User ${req.body.banned ? 'banned' : 'unbanned'}` });
}));

// Admin token refill — uses atomic RPC
router.post('/users/:id/refill-tokens', validate(refillTokensSchema), asyncHandler(async (req, res) => {
  const result = await tokenService.refillTokens(req.params['id']!, req.body.amount, req.user.id);
  if (!result) return sendError(res, 'Failed to refill tokens', { statusCode: 400 });
  return sendSuccess(res, { success: true }, { message: 'Tokens refilled' });
}));

// ═══════════════════════════════════════════════════════════
// COURSE MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/courses', validate(paginationSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' };
  const { data, total } = await courseRepository.findAllAdmin(query);
  const result = paginate(data, total, query);
  return sendSuccess(res, result.data, { meta: result.meta });
}));

router.post('/courses', validate(createCourseSchema), asyncHandler(async (req, res) => {
  const data = await courseRepository.create(req.body);
  return sendSuccess(res, data, { statusCode: 201, message: 'Course created' });
}));

router.put('/courses/:id', validate(updateCourseSchema), asyncHandler(async (req, res) => {
  const data = await courseRepository.update(req.params['id']!, req.body);
  return sendSuccess(res, data, { message: 'Course updated' });
}));

router.delete('/courses/:id', asyncHandler(async (req, res) => {
  await courseRepository.delete(req.params['id']!);
  return sendSuccess(res, null, { message: 'Course deleted' });
}));

// ── Sections ──────────────────────────────────────────────
router.get('/courses/:courseId/sections', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('course_id', req.params['courseId']!)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return sendSuccess(res, data);
}));

router.post('/courses/:courseId/sections', validate(createSectionSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sections')
    .insert({ ...req.body, course_id: req.params['courseId']! })
    .select().single();
  if (error) throw error;
  return sendSuccess(res, data, { statusCode: 201, message: 'Section created' });
}));

router.post('/courses/:courseId/sections/bulk', validate(bulkSectionsSchema), asyncHandler(async (req, res) => {
  const payload = req.body.sections.map((s: { title: string; sort_order: number }) => ({
    ...s, course_id: req.params['courseId']!,
  }));
  const { data, error } = await supabase.from('sections').insert(payload).select();
  if (error) throw error;
  return sendSuccess(res, data, { statusCode: 201, message: 'Sections bulk created' });
}));

router.put('/sections/:id', validate(updateSectionSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sections').update(req.body).eq('id', req.params['id']!).select().single();
  if (error) throw error;
  return sendSuccess(res, data, { message: 'Section updated' });
}));

router.delete('/sections/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('sections').delete().eq('id', req.params['id']!);
  if (error) throw error;
  return sendSuccess(res, null, { message: 'Section deleted' });
}));

// ── Lessons ───────────────────────────────────────────────
router.get('/courses/:courseId/lessons', asyncHandler(async (req, res) => {
  const courseId = req.params['courseId']!;
  let query = supabase.from('lessons').select('*').order('chapter_number', { ascending: true });
  if (courseId !== 'all') query = query.eq('course_id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return sendSuccess(res, data);
}));

router.post('/courses/:courseId/lessons', validate(createLessonSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('lessons')
    .insert({ ...req.body, course_id: req.params['courseId']! })
    .select().single();
  if (error) throw error;
  return sendSuccess(res, data, { statusCode: 201, message: 'Lesson created' });
}));

router.put('/lessons/:id', validate(updateLessonSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('lessons').update(req.body).eq('id', req.params['id']!).select().single();
  if (error) throw error;
  return sendSuccess(res, data, { message: 'Lesson updated' });
}));

router.delete('/lessons/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase.from('lessons').delete().eq('id', req.params['id']!);
  if (error) throw error;
  return sendSuccess(res, null, { message: 'Lesson deleted' });
}));

// ── Quizzes ───────────────────────────────────────────────
router.post('/quizzes', validate(createQuizSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('quizzes').insert(req.body).select().single();
  if (error) throw error;
  return sendSuccess(res, data, { statusCode: 201, message: 'Quiz created' });
}));

// ═══════════════════════════════════════════════════════════
// SETTINGS (FIX #3: DB-based, no .env writing)
// ═══════════════════════════════════════════════════════════

router.get('/settings', asyncHandler(async (_req, res) => {
  const settings = await settingsService.getAll();
  return sendSuccess(res, settings);
}));

router.put('/settings', validate(bulkSettingsSchema), asyncHandler(async (req, res) => {
  for (const { key, value } of req.body.settings) {
    await settingsService.set(key, value, req.user.id);
  }
  return sendSuccess(res, null, { message: 'Settings updated' });
}));

router.put('/settings/:key', validate(updateSettingsSchema), asyncHandler(async (req, res) => {
  await settingsService.set(req.body.key, req.body.value, req.user.id);
  return sendSuccess(res, null, { message: 'Setting updated' });
}));

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

router.post('/notifications', validate(sendNotificationSchema), asyncHandler(async (req, res) => {
  const { targetType, userIds, title, message, type } = req.body;

  let recipients: string[] = [];
  if (targetType === 'ALL') {
    const { data } = await supabase.from('profiles').select('user_id');
    recipients = data?.map(u => u.user_id as string) ?? [];
  } else {
    recipients = userIds ?? [];
  }

  if (recipients.length === 0) {
    return sendError(res, 'No recipients selected', { statusCode: 400 });
  }

  const payloads = recipients.map(uid => ({
    user_id: uid, title, message, type, is_read: false,
  }));

  const { data, error } = await supabase.from('notifications').insert(payloads).select();
  if (error) throw error;

  // Audit log
  await supabase.from('admin_logs').insert({
    admin_id: req.user.id,
    action: 'SEND_NOTIFICATION',
    details: { title, recipientCount: recipients.length },
  });

  return sendSuccess(res, { sent: data?.length ?? 0 }, { message: `Sent to ${recipients.length} users` });
}));

// ═══════════════════════════════════════════════════════════
// REDEEMS
// ═══════════════════════════════════════════════════════════

router.get('/redeems', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('redeem_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return sendSuccess(res, data);
}));

router.put('/redeems/:id', validate(updateRedeemSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('redeem_requests')
    .update({ status: req.body.status, updated_at: new Date().toISOString() })
    .eq('id', req.params['id']!)
    .select().single();
  if (error) throw error;

  await supabase.from('admin_logs').insert({
    admin_id: req.user.id,
    action: `REDEEM_${req.body.status}`,
    target_id: req.params['id'],
  });

  return sendSuccess(res, data, { message: `Request ${req.body.status}` });
}));

// ═══════════════════════════════════════════════════════════
// MODERATION
// ═══════════════════════════════════════════════════════════

router.get('/moderation', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('moderation_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return sendSuccess(res, data);
}));

router.put('/moderation/:id', validate(resolveModerationSchema), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('moderation_reports')
    .update({ status: req.body.status })
    .eq('id', req.params['id']!)
    .select().single();
  if (error) throw error;
  return sendSuccess(res, data, { message: 'Report resolved' });
}));

router.post('/moderation/delete-content', validate(deleteFlaggedContentSchema), asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.body;

  if (contentType === 'ROADMAP') {
    await supabase.from('user_roadmaps').delete().eq('id', contentId);
  } else if (contentType === 'USER') {
    await supabase.from('profiles').update({ is_banned: true }).eq('user_id', contentId);
  }

  await supabase.from('admin_logs').insert({
    admin_id: req.user.id,
    action: 'DELETE_FLAGGED_CONTENT',
    target_id: contentId,
    details: { contentType },
  });

  return sendSuccess(res, null, { message: 'Content handled' });
}));

// ═══════════════════════════════════════════════════════════
// ADMIN LOGS (Audit Trail)
// ═══════════════════════════════════════════════════════════

router.get('/logs', validate(paginationSchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const { from, to } = getRange(page, limit);

  const { data, error, count } = await supabase
    .from('admin_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  const result = paginate(data ?? [], count ?? 0, { page, limit });
  return sendSuccess(res, result.data, { meta: result.meta });
}));

// ═══════════════════════════════════════════════════════════
// HEALTH & TELEMETRY
// ═══════════════════════════════════════════════════════════

router.get('/health', asyncHandler(async (_req, res) => {
  const health = {
    status: 'UP',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    timestamp: new Date().toISOString(),
  };
  return sendSuccess(res, health);
}));

export default router;
