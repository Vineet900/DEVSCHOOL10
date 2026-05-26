import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { authorize } from '../../../middleware/rbac.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { supabase } from '../../../lib/supabase.js';
import { userRepository } from '../../../repositories/user.repository.js';

const router = Router();

// Multer config — memory storage (files go to Supabase Storage / Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// ─── POST /api/v1/uploads/avatar ──────────────────────────
router.post('/avatar', protect, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No image provided', { statusCode: 400 });

  const userId = req.user.id;
  const fileName = `avatars/${userId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

  // Update profile
  await userRepository.updateProfile(userId, { avatar_url: publicUrl });

  return sendSuccess(res, { url: publicUrl }, { message: 'Avatar uploaded' });
}));

// ─── POST /api/v1/uploads/thumbnail (Admin only) ─────────
router.post('/thumbnail', protect, authorize('ADMIN'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No image provided', { statusCode: 400 });

  const fileName = `thumbnails/${Date.now()}.${req.file.mimetype.split('/')[1]}`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

  return sendSuccess(res, { url: publicUrl }, { message: 'Thumbnail uploaded' });
}));

export default router;
