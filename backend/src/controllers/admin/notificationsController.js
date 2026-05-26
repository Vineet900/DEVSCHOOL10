import { adminSupabase } from '../../config/supabase.js'

export const sendNotification = async (req, res) => {
  try {
    const { targetType, userIds, title, message, type } = req.body;
    // targetType can be 'ALL' or 'SELECTED'
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    if (!adminSupabase) return res.json({ success: true, message: 'Notification sent (mock)' });

    let recipients = [];
    if (targetType === 'ALL') {
      const { data: users } = await adminSupabase.from('profiles').select('user_id');
      recipients = users.map(u => u.user_id);
    } else {
      recipients = userIds || [];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients selected' });
    }

    const notificationPayloads = recipients.map(uid => ({
      user_id: uid,
      title,
      message,
      type: type || 'SYSTEM',
      is_read: false
    }));

    const { data, error } = await adminSupabase
      .from('notifications')
      .insert(notificationPayloads)
      .select();

    if (error) throw error;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'SEND_NOTIFICATION',
      details: { title, targetCount: recipients.length }
    });

    res.json({ success: true, message: `Notification sent to ${recipients.length} users successfully`, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
