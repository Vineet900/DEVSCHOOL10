import { adminSupabase } from '../../config/supabase.js'

export const getRedeemRequests = async (req, res) => {
  try {
    if (!adminSupabase) return res.json({ success: true, data: [] });

    const { data, error } = await adminSupabase
      .from('redeem_requests')
      .select('*, profiles:user_id(username, full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, message: "Redeem requests fetched", data });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

export const updateRedeemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    if (!adminSupabase) return res.json({ success: true, data: { id, status } });

    const { data, error } = await adminSupabase
      .from('redeem_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: `REDEEM_REQUEST_${status}`,
      target_id: id
    });

    res.json({ success: true, message: `Request status updated to ${status}`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    if (!adminSupabase) return res.json({ success: true, data: [] });

    const { data, error } = await adminSupabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, message: "Coupons fetched", data });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

export const createCoupon = async (req, res) => {
  try {
    if (!adminSupabase) return res.json({ success: true, data: { id: Date.now(), ...req.body } });

    const { data, error } = await adminSupabase
      .from('coupons')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'CREATE_COUPON',
      target_id: data.id
    });

    res.json({ success: true, message: "Coupon created successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!adminSupabase) return res.json({ success: true, message: "Coupon deleted" });

    const { error } = await adminSupabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the admin activity
    await adminSupabase.from('admin_logs').insert({
      admin_id: req.user.id,
      action: 'DELETE_COUPON',
      target_id: id
    });

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
