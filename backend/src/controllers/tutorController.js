import axios from 'axios';
import { config } from '../config/index.js';
import { supabase } from '../database/supabase.js';

/**
 * @desc    Get AI Tutor response (Strict Production Mode)
 * @route   POST /api/tutor
 */
export const askTutor = async (req, res, next) => {
  try {
    const { question, history, language, level } = req.body;
    const apiKey = config.ai.openRouterKey;
    const targetUserId = req.user?.id;
    
    if (!apiKey) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI Service currently unavailable. Please try again later.' 
      });
    }

    // Check token balance
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('ai_tokens')
      .eq('user_id', targetUserId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const tokens = profile.ai_tokens ?? 50;
    if (tokens <= 0) {
      return res.status(402).json({ 
        success: false, 
        message: 'You have run out of AI Tutor tokens! Please enter your own Gemini API key in settings or contact support to continue.' 
      });
    }

    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'openai/gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are the DevSchool Pro AI Mentor. You help students learn web development. Language: ${language}. Level: ${level}.` 
          },
          ...history,
          { role: 'user', content: question }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': config.cors.origin,
          'X-Title': 'DevSchool Pro'
        },
        timeout: 10000 // 10 second timeout
      });

      // Deduct 1 token upon successful API completion
      const nextTokens = Math.max(0, tokens - 1);
      await supabase
        .from('profiles')
        .update({ ai_tokens: nextTokens })
        .eq('user_id', targetUserId);

      res.status(200).json({
        success: true,
        answer: response.data.choices[0].message.content
      });
    } catch (aiError) {
      // Log error but don't return mock data
      console.error('AI Provider Error:', aiError.message);
      res.status(502).json({ 
        success: false, 
        message: 'The AI Mentor is taking a break. Please retry in a few seconds.' 
      });
    }
  } catch (err) {
    next(err);
  }
};
