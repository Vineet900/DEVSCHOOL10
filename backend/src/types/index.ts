// ─── Core Domain Types ────────────────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  xp: number;
  level: number;
  study_points: number;
  ai_tokens: number;
  streak: number;
  accuracy: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: string;              // Supabase auth.users UUID — ALWAYS derived from JWT
  email: string | null;
  role: UserRole;
  profile?: UserProfile;
  oauthName?: string | null;
  oauthAvatar?: string | null;
  isNewUser?: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Pagination Types ─────────────────────────────────────────────────────────

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ─── Course Domain ────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  slug: string | null;
  is_published: boolean;
  roadmap_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  course_id: string | null;
  title: string;
  content: string | null;
  video_url: string | null;
  duration: number;
  sort_order: number;
  xp_reward: number;
  slug: string | null;
}

// ─── AI Domain ───────────────────────────────────────────────────────────────

export interface TokenDeductionResult {
  success: boolean;
  remaining?: number;
  reason?: 'insufficient_tokens' | 'profile_not_found' | 'db_error';
}

export interface GeminiResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

// ─── Admin Domain ─────────────────────────────────────────────────────────────

export interface AppSetting {
  key: string;
  value: string;
  is_encrypted: boolean;
  updated_by: string | null;
  updated_at: string;
}
