import { adminSupabase } from '../../config/supabase.js'

export const getDetailedLogs = async (req, res) => {
  try {
    if (!adminSupabase) {
      return res.json({
        success: true,
        data: {
          adminLogs: [],
          failedLogins: []
        }
      });
    }

    const [adminLogsRes, failedLoginsRes] = await Promise.all([
      adminSupabase
        .from('admin_logs')
        .select('*, profiles:admin_id(username)')
        .order('created_at', { ascending: false })
        .limit(100),
      adminSupabase
        .from('analytics_events')
        .select('*')
        .eq('event_name', 'auth_failed')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    res.json({
      success: true,
      message: "Logs fetched successfully",
      data: {
        adminLogs: adminLogsRes.data || [],
        failedLogins: failedLoginsRes.data || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
