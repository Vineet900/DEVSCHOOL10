import { supabase } from '../database/supabase.js';
import { z } from 'zod';

const roadmapStepSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  xp: z.number().int().nonnegative().default(100),
  courseId: z.string().optional(), // Can link to a specific course if desired
});

const roadmapSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  steps: z.array(roadmapStepSchema).default([]),
});

/**
 * @desc    Get user's custom roadmaps
 * @route   GET /api/roadmaps/user
 */
export const getUserRoadmaps = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: roadmaps, error } = await supabase
      .from('user_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a custom roadmap
 * @route   POST /api/roadmaps/user
 */
export const createUserRoadmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = roadmapSchema.parse(req.body);

    const { data: roadmap, error } = await supabase
      .from('user_roadmaps')
      .insert({
        user_id: userId,
        title: validatedData.title,
        description: validatedData.description,
        steps: validatedData.steps,
        is_custom: true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: roadmap,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a custom roadmap
 * @route   PUT /api/roadmaps/user/:id
 */
export const updateUserRoadmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const validatedData = roadmapSchema.parse(req.body);

    // Make sure it belongs to the user
    const { data: existing, error: findError } = await supabase
      .from('user_roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found or unauthorized',
      });
    }

    const { data: roadmap, error } = await supabase
      .from('user_roadmaps')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        steps: validatedData.steps,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a custom roadmap
 * @route   DELETE /api/roadmaps/user/:id
 */
export const deleteUserRoadmap = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Make sure it belongs to the user
    const { data: existing, error: findError } = await supabase
      .from('user_roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found or unauthorized',
      });
    }

    const { error } = await supabase
      .from('user_roadmaps')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
