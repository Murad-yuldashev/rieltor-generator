import { Body, Controller, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { AiDescriptionRequestSchema, type AiDescriptionResult } from '@rieltor/shared';
import { JwtGuard } from '../auth/jwt.guard';
import { GeminiService } from './gemini.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/ai/description.
// Guarded — only logged-in users (mid-wizard) can trigger a generation call.
@Controller('ai')
@UseGuards(JwtGuard)
export class AiController {
  constructor(private readonly gemini: GeminiService) {}

  @Post('description')
  async description(@Body() body: unknown): Promise<AiDescriptionResult> {
    const req = AiDescriptionRequestSchema.parse(body);

    const roomsPart = req.rooms != null ? `${req.rooms} xonali` : "xonalar soni ko'rsatilmagan";
    const floorPart = req.floor ? `, ${req.floor}-qavat` : '';
    const landmarkPart = req.landmark ? `, mo'ljal: ${req.landmark}` : '';
    const prompt = `Sen O'zbekistonda ko'chmas mulk e'lonlari uchun tavsif yozadigan yordamchisan. Faqat quyida berilgan ma'lumotlar asosida, 3-5 gapdan iborat tabiiy va halol o'zbek tilida e'lon tavsifini yoz. Berilmagan qulayliklar yoki xususiyatlarni o'ylab topma, faqat mavjud faktlarni ishlat. Turi: ${req.type}, bitim: ${req.deal}, tuman: ${req.district}, ${roomsPart}, maydon: ${req.areaM2} m²${floorPart}${landmarkPart}.`;

    const description = await this.gemini.generate(prompt, { maxTokens: 400 });

    if (description == null) {
      throw new ServiceUnavailableException("AI hozircha mavjud emas, tavsifni qo'lda yozing");
    }

    return { description };
  }
}
