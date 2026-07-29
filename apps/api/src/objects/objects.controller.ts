import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ObjectDetailDto, ObjectListItemDto } from './objects.dto';
import { ObjectsService } from './objects.service';

@ApiTags('objects')
@Controller('objects')
export class ObjectsController {
  constructor(private readonly objects: ObjectsService) {}

  @Get()
  @ApiOkResponse({ type: [ObjectListItemDto] })
  royxat() {
    return this.objects.royxat();
  }

  @Get(':id')
  @ApiOkResponse({ type: ObjectDetailDto })
  @ApiNotFoundResponse({ description: 'Obyekt topilmadi' })
  bittasi(@Param('id') id: string) {
    return this.objects.bittasi(id);
  }
}
