import { adminSupabase } from '../../config/supabase.js'

export const getModerationReports = async (req, res) => {
  try {
    if (!adminSupabase) return res.json({ success: true, data: [] });

    const { data, error } = await adminSupabase
      .from('moderation_reports')
      .select('*, reporter:reporter_id(username), reported:reported_user_id(username)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, message: "Moderation reports fetched", data });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

export const resolveModerationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'RESOLVED' or 'PENDING'
    if (!adminSupabase) return res.json({ success: true, data: { id, status } });

    const { data, error } = await adminSupabase
      .from('moderation_reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'RESOLVE_MODERATION_REPORT',
      target_id: id
    });

    res.json({ success: true, message: "Moderation report resolved", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteFlaggedContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    if (!adminSupabase) return res.json({ success: true, message: "Content deleted (mock)" });

    let deleteError = null;

    if (contentType === 'ROADMAP') {
      const { error } = await adminSupabase
        .from('user_roadmaps')
        .delete()
        .eq('id', contentId);
      deleteError = error;
    } else if (contentType === 'USER') {
      // Banning user instead of hard deletion to protect references
      const { error } = await adminSupabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('user_id', contentId);
      deleteError = error;
    }

    if (deleteError) throw deleteError;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'DELETE_FLAGGED_CONTENT',
      target_id: contentId,
      details: { contentType }
    });

    res.json({ success: true, message: `${contentType} content deleted or handled successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
