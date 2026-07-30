import { Controller, Get, HttpCode, Ip, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ViewsDto } from './views.dto';
import { ViewsService } from './views.service';

@ApiTags('views')
@Controller('view')
export class ViewsController {
  constructor(private readonly views: ViewsService) {}

  @Post(':id')
  @HttpCode(200)
  @ApiOkResponse({ type: ViewsDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  async korish(@Param('id') id: string, @Ip() ip: string) {
    return { views: await this.views.korish(id, ip) };
  }

  @Get(':id')
  @ApiOkResponse({ type: ViewsDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  async joriy(@Param('id') id: string) {
    return { views: await this.views.joriy(id) };
  }
}
