import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ListingDraftSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ListingsService } from './listings.service';

@Controller('my/listings')
@UseGuards(JwtGuard)
export class ListingDraftController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  listMine(@CurrentUser() user: { id: string }) {
    return this.listings.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }) {
    return this.listings.createDraft(user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.listings.updateDraft(id, user.id, ListingDraftSchema.parse(body));
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.listings.submitForModeration(id, user.id);
  }
}
