import { supabase } from '../lib/supabase.js';
import { getRange } from '../utils/pagination.js';
import type { PaginationQuery } from '../types/index.js';

// ─── Course Repository ────────────────────────────────────────────────────────

export class CourseRepository {
  /** Paginated public course list — no nested lessons (separate endpoint) */
  async findAllPublished(pagination: PaginationQuery) {
    const { from, to } = getRange(pagination.page, pagination.limit);

    let query = supabase
      .from('courses')
      .select('id, title, description, thumbnail, slug, created_at', { count: 'exact' })
      .eq('is_published', true);

    if (pagination.search) {
      query = query.ilike('title', `%${pagination.search}%`);
    }

    const sortBy = pagination.sortBy ?? 'created_at';
    const ascending = pagination.sortOrder === 'asc';

    const { data, error, count } = await query
      .order(sortBy, { ascending })
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  /** Course detail with sections (no lessons — fetched separately) */
  async findById(courseId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*, sections(id, title, sort_order)')
      .eq('id', courseId)
      .order('sort_order', { referencedTable: 'sections', ascending: true })
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /** Lessons for a section — paginated */
  async findLessonsBySection(sectionId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title, duration, sort_order, xp_reward, slug')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /** Single lesson detail */
  async findLessonById(lessonId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /** Enrollment */
  async enroll(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    return !!data;
  }

  async getUserEnrollments(userId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id, created_at, courses(id, title, thumbnail)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // ─── Admin: All courses (including unpublished) ─────────
  async findAllAdmin(pagination: PaginationQuery) {
    const { from, to } = getRange(pagination.page, pagination.limit);

    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' });

    if (pagination.search) {
      query = query.ilike('title', `%${pagination.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async create(courseData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(courseId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(courseId: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
  }
}

export const courseRepository = new CourseRepository();
