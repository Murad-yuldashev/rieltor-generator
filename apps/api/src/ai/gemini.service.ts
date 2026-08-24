import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

  /** Returns the model's text, or null if AI is unavailable / errored. Never throws. */
  async generate(prompt: string, opts?: { maxTokens?: number }): Promise<string | null> {
    if (!this.client) return null;
    try {
      const model = this.client.getGenerativeModel({
        model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: opts?.maxTokens ?? 512 },
      });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      // A provider outage must never take down a request — the caller falls back.
      this.logger.warn(`Gemini generate failed: ${String(error)}`);
      return null;
    }
  }
}
