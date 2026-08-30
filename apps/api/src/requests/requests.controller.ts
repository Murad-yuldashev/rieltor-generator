import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PropertyRequestCreateSchema, PropertyRequestFilterSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.requests.listOpen(PropertyRequestFilterSchema.parse(query));
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.requests.create(user.id, PropertyRequestCreateSchema.parse(body));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requests.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  close(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.requests.close(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.requests.remove(id, user.id);
  }
}
