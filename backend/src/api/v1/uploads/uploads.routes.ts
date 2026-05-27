import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { protect } from '../../../middleware/auth.middleware.js';
import { authorize } from '../../../middleware/rbac.middleware.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';
import { supabase } from '../../../lib/supabase.js';
import { userRepository } from '../../../repositories/user.repository.js';
import { ValidationError } from '../../../utils/errors.js';

const router = Router();

// ─── SECURITY: Magic Byte Signatures ──────────────────────────────────────────
// We validate actual file content bytes, NOT the client-provided MIME header.
// An attacker can set Content-Type: image/png on a malicious SVG/HTML file.
// Magic bytes are the ONLY reliable way to verify file type server-side.
const MAGIC_BYTES: Record<string, { bytes: number[]; ext: string; mime: string }> = {
  png:  { bytes: [0x89, 0x50, 0x4E, 0x47], ext: 'png',  mime: 'image/png' },
  jpg:  { bytes: [0xFF, 0xD8, 0xFF],       ext: 'jpg',  mime: 'image/jpeg' },
  gif:  { bytes: [0x47, 0x49, 0x46],        ext: 'gif',  mime: 'image/gif' },
  webp: { bytes: [0x52, 0x49, 0x46, 0x46],  ext: 'webp', mime: 'image/webp' },
};

function validateMagicBytes(buffer: Buffer): { ext: string; mime: string } | null {
  for (const [, sig] of Object.entries(MAGIC_BYTES)) {
    if (sig.bytes.every((byte, i) => buffer[i] === byte)) {
      return { ext: sig.ext, mime: sig.mime };
    }
  }
  return null; // Not a recognized safe image type
}

// Multer config — memory storage, strict limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB hard limit
  fileFilter: (_req, file, cb) => {
    // First gate: reject obviously non-image MIME types
    // NOTE: This is NOT the security boundary — magic bytes below are.
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

  // SECURITY: Validate actual file content, not client-provided headers
  const detected = validateMagicBytes(req.file.buffer);
  if (!detected) {
    throw new ValidationError(
      'Invalid image file. Only PNG, JPG, GIF, and WebP are allowed. ' +
      'SVG and other formats are blocked for security reasons.'
    );
  }

  const userId = req.user.id;
  // Use detected extension (from magic bytes), NOT from client MIME header
  const fileName = `avatars/${userId}-${Date.now()}.${detected.ext}`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: detected.mime, // Use verified MIME, not client-provided
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
  await userRepository.updateProfile(userId, { avatar_url: publicUrl });

  return sendSuccess(res, { url: publicUrl }, { message: 'Avatar uploaded' });
}));

// ─── POST /api/v1/uploads/thumbnail (Admin only) ─────────
router.post('/thumbnail', protect, authorize('ADMIN'), upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 'No image provided', { statusCode: 400 });

  // SECURITY: Validate actual file content
  const detected = validateMagicBytes(req.file.buffer);
  if (!detected) {
    throw new ValidationError(
      'Invalid image file. Only PNG, JPG, GIF, and WebP are allowed.'
    );
  }

  const fileName = `thumbnails/${Date.now()}.${detected.ext}`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, req.file.buffer, {
      contentType: detected.mime,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

  return sendSuccess(res, { url: publicUrl }, { message: 'Thumbnail uploaded' });
}));

export default router;

