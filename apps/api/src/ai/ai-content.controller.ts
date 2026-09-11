import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiContentRequestSchema, type AiContentResponse } from '@rieltor/shared';
import { RealtorGuard } from '../agent/realtor.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { GeminiService } from './gemini.service';
import { buildContentTemplate } from './ai-content.template';
import { buildContentPrompt, parseContent } from './ai-content.parse';

// @Controller('ai') → /api/ai/content. Realtor-gated (paid marketing tool). Coexists with the
// guarded AiController (/description) and the public AiSearchController (/search-parse).
@Controller('ai')
@UseGuards(JwtGuard, RealtorGuard)
export class AiContentController {
  constructor(private readonly gemini: GeminiService) {}

  @Post('content')
  async content(@Body() body: unknown): Promise<AiContentResponse> {
    const req = AiContentRequestSchema.parse(body); // bad body -> ZodError -> 400
    const template = buildContentTemplate(req);
    const raw = await this.gemini.generate(buildContentPrompt(req), { maxTokens: 400 });
    return parseContent(raw, template); // never throws; fallback on any AI/parse problem
  }
}
