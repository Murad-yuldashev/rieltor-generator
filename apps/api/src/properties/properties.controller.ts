import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TrackedPropertyCreateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { PropertiesService } from './properties.service';

// Global 'api' prefix → real URLs are /api/my/properties[...].
@Controller('my/properties')
@UseGuards(JwtGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.properties.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.properties.create(user.id, TrackedPropertyCreateSchema.parse(body));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.properties.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.properties.remove(id, user.id);
  }
}
