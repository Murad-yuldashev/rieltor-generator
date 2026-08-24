import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SavedSearchCreateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { SavedSearchService } from './saved-search.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/my/saved-searches.
@Controller('my/saved-searches')
@UseGuards(JwtGuard)
export class SavedSearchController {
  constructor(private readonly savedSearches: SavedSearchService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.savedSearches.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.savedSearches.create(user.id, SavedSearchCreateSchema.parse(body));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.savedSearches.remove(id, user.id);
  }
}
