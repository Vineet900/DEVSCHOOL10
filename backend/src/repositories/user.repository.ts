import { supabase } from '../lib/supabase.js';
import { getRange } from '../utils/pagination.js';
import type { PaginationQuery } from '../types/index.js';

// ─── User Repository ──────────────────────────────────────────────────────────
// All DB queries for user/profile data. Controllers never touch supabase directly.

export class UserRepository {
  async findByUserId(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByUsername(username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createProfile(data: {
    user_id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  }) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  async updateProfile(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLeaderboard(pagination: PaginationQuery) {
    const { from, to } = getRange(pagination.page, pagination.limit);

    const { data, error, count } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, xp, level, streak', { count: 'exact' })
      .eq('is_banned', false)
      .order('xp', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  // ─── Admin: Paginated User List ─────────────────────────
  async findAll(pagination: PaginationQuery) {
    const { from, to } = getRange(pagination.page, pagination.limit);

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Search by username or name
    if (pagination.search) {
      query = query.or(
        `username.ilike.%${pagination.search}%,full_name.ilike.%${pagination.search}%`
      );
    }

    // Sort
    const sortBy = pagination.sortBy ?? 'created_at';
    const ascending = pagination.sortOrder === 'asc';
    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async banUser(userId: string, banned: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_banned: banned, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ─── Dashboard Aggregates (DB-level, no full table scan) ─
  async getDashboardCounts() {
    const [usersRes, coursesRes, lessonsRes, quizzesRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersRes.count ?? 0,
      totalCourses: coursesRes.count ?? 0,
      totalLessons: lessonsRes.count ?? 0,
      totalQuizzes: quizzesRes.count ?? 0,
    };
  }

  async getActiveUsersCount(since: string) {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', since);

    if (error) throw error;
    return count ?? 0;
  }

  async getRecentUsers(limit = 5) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, avatar_url, created_at, role')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}

export const userRepository = new UserRepository();
