import axios, { type AxiosError } from 'axios';
import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { UpstreamError } from '../../utils/errors.js';
import type { GeminiResponse } from '../../types/index.js';
import { settingsService } from '../settings.service.js';

// ─── Gemini AI Service ────────────────────────────────────────────────────────
// FIX #6: API Key Exposure — custom API keys were accepted in request body
//         and therefore leaked to logs.
//
// NEW APPROACH:
//   - Server API key comes from config (env var) OR DB settings (encrypted)
//   - User's custom key ONLY from X-Custom-Api-Key header (never body)
//   - Headers are NOT logged by Morgan or Winston
//   - No API key ever appears in response bodies or error messages

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  /** User's custom key — ONLY from request header, NEVER from body */
  customApiKey?: string;
}

export class GeminiService {
  /**
   * Call the Gemini API with automatic retry on transient failures.
   *
   * SECURITY: customApiKey must come from req.headers['x-custom-api-key'].
   * The controller is responsible for extracting it from the correct source.
   * This service never logs the key.
   */
  async generate(options: GeminiCallOptions): Promise<GeminiResponse> {
    const { prompt, systemInstruction, model, customApiKey } = options;

    // API key resolution order:
    // 1. User's custom key (from header, never body)
    // 2. Admin-configured key in DB settings
    // 3. Boot-time env var
    const apiKey = customApiKey ?? (await this.resolveServerApiKey());

    if (!apiKey) {
      throw new UpstreamError('AI Service', 'AI service is not configured. Please contact support.');
    }

    const resolvedModel = model ?? config.ai.geminiModel;
    const url = `${GEMINI_API_BASE}/${resolvedModel}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(systemInstruction && {
        systemInstruction: { parts: [{ text: systemInstruction }] },
      }),
    };

    return this.callWithRetry(url, body, resolvedModel, MAX_RETRIES);
  }

  private async callWithRetry(
    url: string,
    body: object,
    model: string,
    retriesLeft: number
  ): Promise<GeminiResponse> {
    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: TIMEOUT_MS,
      });

      const text: string | undefined =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new UpstreamError('Gemini', 'Empty response from AI provider');
      }

      const tokensUsed = (response.data?.usageMetadata?.totalTokenCount as number) ?? 0;

      return { text: text.trim(), tokensUsed, model };
    } catch (err) {
      const axiosErr = err as AxiosError;

      // Log error without the URL (which contains the API key)
      logger.error('[GeminiService] API call failed', {
        model,
        status: axiosErr.response?.status,
        retriesLeft,
        // NEVER log: url, apiKey, or response body (may contain key info)
      });

      // Retry on transient errors (5xx, timeout, network)
      if (retriesLeft > 0 && this.isRetryable(axiosErr)) {
        const delay = (MAX_RETRIES - retriesLeft + 1) * 1000; // 1s, 2s backoff
        await this.sleep(delay);
        return this.callWithRetry(url, body, model, retriesLeft - 1);
      }

      // Surface quota/auth errors with safe messages
      if (axiosErr.response?.status === 429) {
        throw new UpstreamError('Gemini', 'AI rate limit reached. Please try again shortly.');
      }
      if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
        throw new UpstreamError('Gemini', 'AI service authentication failed.');
      }

      throw new UpstreamError('Gemini');
    }
  }

  private isRetryable(err: AxiosError): boolean {
    if (!err.response) return true; // Network error — always retry
    return err.response.status >= 500; // Server errors — retry
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Resolve the server-side API key.
   * Checks DB settings first (admin-configurable), falls back to env.
   * NEVER writes back to env or process.env.
   */
  private async resolveServerApiKey(): Promise<string | undefined> {
    try {
      const dbKey = await settingsService.get('GEMINI_API_KEY');
      if (dbKey) return dbKey;
    } catch {
      // Fall through to env
    }
    return config.ai.geminiApiKey;
  }

  /**
   * Extract JSON from AI response text.
   * Handles markdown code fences and bracket extraction.
   */
  extractJson<T = unknown>(text: string): T {
    // Direct parse
    try {
      return JSON.parse(text) as T;
    } catch {
      // Try markdown code block
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch?.[1]) {
        try {
          return JSON.parse(fenceMatch[1].trim()) as T;
        } catch {
          // Fall through
        }
      }

      // Try bracket extraction
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(text.substring(start, end + 1)) as T;
        } catch {
          // Fall through
        }
      }

      throw new Error('Failed to extract valid JSON from AI response');
    }
  }
}

export const geminiService = new GeminiService();
