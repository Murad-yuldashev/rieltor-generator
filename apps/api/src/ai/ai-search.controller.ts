import { Body, Controller, Post } from '@nestjs/common';
import { AiSearchRequestSchema, type AiSearchResponse } from '@rieltor/shared';
import { GeminiService } from './gemini.service';
import { buildSearchPrompt, buildSearchResponse } from './ai-search.parse';

// @Controller('ai') → /api/ai/search-parse. PUBLIC (buyer-facing, no guard) like @Controller('objects').
// Does not collide with the guarded AiController's /api/ai/description.
@Controller('ai')
export class AiSearchController {
  constructor(private readonly gemini: GeminiService) {}

  @Post('search-parse')
  async searchParse(@Body() body: unknown): Promise<AiSearchResponse> {
    const { query } = AiSearchRequestSchema.parse(body); // >200 / empty → ZodError → 400
    const raw = await this.gemini.generate(buildSearchPrompt(query), { maxTokens: 256 });
    return buildSearchResponse(raw, query); // never throws; fallback on any AI/parse problem
  }
}
