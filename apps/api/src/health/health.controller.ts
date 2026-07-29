import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Servis tirikligi' })
  check() {
    return { status: 'ok' };
  }
}
