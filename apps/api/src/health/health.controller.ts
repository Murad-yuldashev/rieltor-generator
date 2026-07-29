import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Servis va DB tirikligi' })
  async check() {
    const db = await this.prisma.ishlayaptimi();
    return { status: db ? 'ok' : 'degraded', db };
  }
}
