import { adminSupabase } from '../../config/supabase.js'

export const getSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!adminSupabase) return res.json({ success: true, data: [] });

    const { data, error } = await adminSupabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json({ success: true, message: "Sections fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const createSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const sectionData = { ...req.body, course_id: courseId };
    if (!adminSupabase) return res.json({ success: true, data: { id: Date.now(), ...sectionData } });

    const { data, error } = await adminSupabase
      .from('sections')
      .insert([sectionData])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: "Section created", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!adminSupabase) return res.json({ success: true, data: { id, ...req.body } });

    const { data, error } = await adminSupabase
      .from('sections')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: "Section updated", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!adminSupabase) return res.json({ success: true, message: "Section deleted" });

    const { error } = await adminSupabase
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: "Section deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const bulkUploadSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sections } = req.body; // Array of section data [{title, sort_order}]
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ success: false, message: 'Invalid sections payload' });
    }

    const payload = sections.map(s => ({
      course_id: courseId,
      title: s.title,
      sort_order: s.sort_order || 0
    }));

    if (!adminSupabase) return res.json({ success: true, data: payload });

    const { data, error } = await adminSupabase
      .from('sections')
      .insert(payload)
      .select();

    if (error) throw error;
    res.json({ success: true, message: "Sections bulk uploaded successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
