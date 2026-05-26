import { adminSupabase } from '../../config/supabase.js'

export const getDashboardStats = async (req, res) => {
  try {
    if (!adminSupabase) {
      return res.json({
        success: true,
        data: {
          totalUsers: 0,
          activeUsers: 0,
          totalCourses: 0,
          totalLessons: 0,
          totalQuizzes: 0,
          completionRate: 0,
          totalStudyHours: 0,
          totalStudyPoints: 0,
          pendingRequests: 0,
          totalRedeems: 0,
          recentUsers: [],
          recentActivities: [],
          chartData: [],
          courseEngagement: []
        }
      })
    }

    // 1. Fetch core counts
    const [
      usersRes,
      coursesRes,
      lessonsRes,
      quizzesRes,
      progressRes,
      redeemsRes,
      moderationRes
    ] = await Promise.all([
      adminSupabase.from('profiles').select('*'),
      adminSupabase.from('courses').select('id, title'),
      adminSupabase.from('lessons').select('id, title, section_id'),
      adminSupabase.from('quizzes').select('id, title'),
      adminSupabase.from('user_progress').select('*'),
      adminSupabase.from('redeem_requests').select('*'),
      adminSupabase.from('moderation_reports').select('id').eq('status', 'PENDING')
    ]);

    const profiles = usersRes.data || [];
    const courses = coursesRes.data || [];
    const lessons = lessonsRes.data || [];
    const quizzes = quizzesRes.data || [];
    const progress = progressRes.data || [];
    const redeems = redeemsRes.data || [];
    const pendingReportsCount = moderationRes.data?.length || 0;

    const totalUsers = profiles.length;
    const totalCourses = courses.length;
    const totalQuizzes = quizzes.length;
    const totalLessons = lessons.length;

    // 2. Calculate sums
    const totalStudyHours = profiles.reduce((acc, p) => acc + (p.study_hours || 0), 0);
    const totalStudyPoints = profiles.reduce((acc, p) => acc + (p.study_points || 0), 0);
    
    // Active users in the last 24 hours (updated_at >= 24h ago)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const activeUsersToday = profiles.filter(p => p.updated_at && p.updated_at >= oneDayAgo).length;

    // New users in the last 7 days (created_at >= 7d ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newUsers = profiles.filter(p => p.created_at && p.created_at >= sevenDaysAgo).length;

    // Course Completion Rate
    const completedLessons = progress.filter(p => p.is_completed).length;
    let completionRate = 0;
    if (totalLessons > 0 && totalUsers > 0) {
      completionRate = Math.min(100, Math.round((completedLessons / (totalLessons * totalUsers)) * 100));
    }

    const pendingRedeemsCount = redeems.filter(r => r.status === 'PENDING').length;
    const totalRedeemRequests = redeems.length;
    const pendingRequests = pendingRedeemsCount + pendingReportsCount;

    // 3. Fetch recent events for Activity Feed
    const [quizAttemptsRes, recentProgressRes] = await Promise.all([
      adminSupabase.from('quiz_attempts').select('*').order('attempted_at', { ascending: false }).limit(5),
      adminSupabase.from('user_progress').select('*').eq('is_completed', true).order('updated_at', { ascending: false }).limit(5)
    ]);

    const quizAttempts = quizAttemptsRes.data || [];
    const recentProgress = recentProgressRes.data || [];

    // Create lookup maps
    const userMap = {};
    profiles.forEach(p => {
      userMap[p.user_id] = p.username || p.full_name || 'User';
    });

    const quizMap = {};
    quizzes.forEach(q => {
      quizMap[q.id] = q.title;
    });

    const lessonMap = {};
    lessons.forEach(l => {
      lessonMap[l.id] = l.title;
    });

    const activities = [];

    // Signups
    profiles.forEach(p => {
      if (p.created_at) {
        activities.push({
          id: `signup-${p.id}`,
          type: 'SIGNUP',
          text: `New signup: @${p.username} joined DevSchoolPro`,
          time: p.created_at,
          timestamp: new Date(p.created_at).getTime()
        });
      }
    });

    // Quiz Attempts
    quizAttempts.forEach(a => {
      const username = userMap[a.user_id] || 'User';
      const quizTitle = quizMap[a.quiz_id] || 'Quiz';
      if (a.attempted_at) {
        activities.push({
          id: `quiz-${a.id}`,
          type: 'QUIZ',
          text: `@${username} scored ${a.score}% on ${quizTitle}`,
          time: a.attempted_at,
          timestamp: new Date(a.attempted_at).getTime()
        });
      }
    });

    // Redeems
    redeems.forEach(r => {
      const username = userMap[r.user_id] || 'User';
      if (r.created_at) {
        activities.push({
          id: `redeem-${r.id}`,
          type: 'REDEEM',
          text: `@${username} submitted redeem request: ${r.points_cost} SP for ${r.reward_title}`,
          time: r.created_at,
          timestamp: new Date(r.created_at).getTime()
        });
      }
    });

    // Completions
    recentProgress.forEach(p => {
      const username = userMap[p.user_id] || 'User';
      const lessonTitle = lessonMap[p.lesson_id] || 'Lesson';
      if (p.updated_at) {
        activities.push({
          id: `progress-${p.id}`,
          type: 'COMPLETED',
          text: `@${username} completed ${lessonTitle} module`,
          time: p.updated_at,
          timestamp: new Date(p.updated_at).getTime()
        });
      }
    });

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Format the time strings nicely (e.g., "5 mins ago", "1 hour ago", etc. or locale date)
    const formatTime = (ts) => {
      const diffMs = Date.now() - ts;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const recentActivities = activities.slice(0, 8).map(act => ({
      id: act.id,
      type: act.type,
      text: act.text,
      time: formatTime(act.timestamp),
      badge: act.type === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
             act.type === 'SIGNUP' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
             act.type === 'REDEEM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
             act.type === 'QUIZ' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
             'bg-violet-500/10 text-violet-400 border-violet-500/20'
    }));

    // 4. Generate Chart Data (7 Days)
    const chartData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      
      const daySignups = profiles.filter(p => p.created_at && p.created_at.startsWith(dateStr)).length;
      
      // Active sessions count (number of unique users who completed progress or registered on this day)
      const dayProgressUsers = new Set(
        progress
          .filter(p => p.updated_at && p.updated_at.startsWith(dateStr))
          .map(p => p.user_id)
      );
      profiles.filter(p => p.created_at && p.created_at.startsWith(dateStr)).forEach(p => dayProgressUsers.add(p.user_id));

      chartData.push({
        day: dayName,
        dateStr,
        signups: daySignups,
        actives: dayProgressUsers.size
      });
    }

    // Calculate cumulative growth for graph
    const sevenDaysAgoTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const signupsBeforeWindow = profiles.filter(p => p.created_at && new Date(p.created_at).getTime() < sevenDaysAgoTime).length;
    
    let cumulative = signupsBeforeWindow;
    const finalChartData = chartData.map(c => {
      cumulative += c.signups;
      return {
        day: c.day,
        growth: cumulative,
        actives: c.actives
      };
    });

    // 5. Course Engagement
    // Count how many progress logs exist for each course
    const { data: sections } = await adminSupabase.from('sections').select('id, course_id');
    const sectionToCourseMap = {};
    if (sections) {
      sections.forEach(s => {
        sectionToCourseMap[s.id] = s.course_id;
      });
    }

    const lessonToCourseMap = {};
    lessons.forEach(l => {
      const courseId = sectionToCourseMap[l.section_id];
      if (courseId) {
        lessonToCourseMap[l.id] = courseId;
      }
    });

    const courseProgressCount = {};
    courses.forEach(c => {
      courseProgressCount[c.id] = 0;
    });

    progress.forEach(p => {
      const courseId = lessonToCourseMap[p.lesson_id];
      if (courseId) {
        courseProgressCount[courseId] = (courseProgressCount[courseId] || 0) + 1;
      }
    });

    // Form course engagement stats (top 8 courses or all)
    const courseEngagement = courses.map((c, idx) => ({
      id: c.id,
      title: c.title,
      code: `C${idx + 1}`,
      value: courseProgressCount[c.id] || 0
    })).slice(0, 8);

    // Fetch 5 most recent profiles for the dashboard state
    const { data: recentUsers } = await adminSupabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at, role')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      message: "Dashboard database metrics loaded successfully",
      data: {
        totalUsers,
        activeUsers: activeUsersToday,
        newUsers,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalStudyHours,
        totalStudyPoints,
        pendingRequests,
        pendingRedeems: pendingRedeemsCount,
        totalRedeemRequests,
        completionRate,
        recentUsers: recentUsers || [],
        recentActivities,
        chartData: finalChartData,
        courseEngagement
      }
    });
  } catch (error) {
    console.error('getDashboardStats exception:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics', error: error.message })
  }
}
