import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CronGuard } from './cron.guard';
import { MaintenanceService } from './maintenance.service';

// Called once a day by an external scheduler (Netlify Scheduled Function, or any
// cron runner pointed at the same endpoint in Docker/Railway — design spec §7.5),
// not by a browser, hence no Swagger response DTO: this is an operational endpoint.
@ApiTags('internal')
@Controller('internal/cron')
@UseGuards(CronGuard)
@ApiForbiddenResponse({ description: 'Cron siri notoʻgʻri yoki sozlanmagan' })
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post('daily')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Kunlik texnik xizmat vazifalari bajarildi' })
  runDaily() {
    return this.maintenance.runDaily();
  }
}
