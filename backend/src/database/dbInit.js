import prisma from './prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Ensures the 'ai_tokens' column exists in public.profiles and 
 * updates all existing users to have 50 tokens if not already defined.
 */
export const initDbSchema = async () => {
  try {
    logger.info('Database Schema Check: Verifying public.profiles.ai_tokens...');
    
    // 1. Add ai_tokens column if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS ai_tokens INTEGER DEFAULT 50 CHECK (ai_tokens >= 0);
    `);
    
    // 2. Initialize existing users with 50 tokens if null or empty
    await prisma.$executeRawUnsafe(`
      UPDATE public.profiles
      SET ai_tokens = COALESCE(ai_tokens, 50)
      WHERE ai_tokens IS NULL;
    `);

    logger.info('Database Schema Check: "profiles.ai_tokens" successfully configured.');
  } catch (err) {
    logger.error('Database Schema Check Error: ' + err.message);
  }
};
