import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import {
  CollectionAddItemSchema,
  CollectionCreateSchema,
  CollectionReorderSchema,
  CollectionUpdateSchema,
  NoteUpsertSchema,
  RealtorProfileUpdateSchema,
} from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { CollectionsService } from './collections.service';
import { NotesService } from './notes.service';
import { ProfileService } from './profile.service';
import { RealtorGuard } from './realtor.guard';
import { SubscriptionService } from './subscription.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/agent/*.
@Controller('agent')
@UseGuards(JwtGuard)
export class AgentController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly profiles: ProfileService,
    private readonly notes: NotesService,
    private readonly collections: CollectionsService,
  ) {}

  // become-realtor + subscription routes are JwtGuard-only: right after the
  // upgrade the caller's JWT still says USER, so gating on JWT role would lock
  // them out. RealtorGuard (below) reads role fresh from the DB instead.
  @Post('become-realtor')
  becomeRealtor(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.becomeRealtor(user.id);
  }

  @Get('subscription')
  subscription(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.view(user.id);
  }

  @Post('subscription/activate')
  activate(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.activate(user.id);
  }

  @Get('profile')
  @UseGuards(RealtorGuard)
  getProfile(@CurrentUser() user: { id: string; role: string }) {
    return this.profiles.get(user.id);
  }

  @Patch('profile')
  @UseGuards(RealtorGuard)
  updateProfile(@CurrentUser() user: { id: string; role: string }, @Body() body: unknown) {
    return this.profiles.update(user.id, RealtorProfileUpdateSchema.parse(body));
  }

  @Get('notes')
  @UseGuards(RealtorGuard)
  listNotes(@CurrentUser() user: { id: string; role: string }) {
    return this.notes.list(user.id);
  }

  @Get('notes/:listingId')
  @UseGuards(RealtorGuard)
  getNote(
    @CurrentUser() user: { id: string; role: string },
    @Param('listingId') listingId: string,
  ) {
    return this.notes.get(user.id, listingId);
  }

  @Put('notes/:listingId')
  @UseGuards(RealtorGuard)
  upsertNote(
    @CurrentUser() user: { id: string; role: string },
    @Param('listingId') listingId: string,
    @Body() body: unknown,
  ) {
    return this.notes.upsert(user.id, listingId, NoteUpsertSchema.parse(body).body);
  }

  @Delete('notes/:listingId')
  @UseGuards(RealtorGuard)
  removeNote(
    @CurrentUser() user: { id: string; role: string },
    @Param('listingId') listingId: string,
  ) {
    return this.notes.remove(user.id, listingId);
  }

  @Get('collections')
  @UseGuards(RealtorGuard)
  listCollections(@CurrentUser() user: { id: string; role: string }) {
    return this.collections.list(user.id);
  }

  @Post('collections')
  @UseGuards(RealtorGuard)
  createCollection(@CurrentUser() user: { id: string; role: string }, @Body() body: unknown) {
    return this.collections.create(user.id, CollectionCreateSchema.parse(body).name);
  }

  @Get('collections/:id')
  @UseGuards(RealtorGuard)
  collectionDetail(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.collections.detail(user.id, id);
  }

  @Patch('collections/:id')
  @UseGuards(RealtorGuard)
  renameCollection(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.collections.rename(user.id, id, CollectionUpdateSchema.parse(body).name);
  }

  @Delete('collections/:id')
  @UseGuards(RealtorGuard)
  removeCollection(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.collections.remove(user.id, id);
  }

  @Post('collections/:id/items')
  @UseGuards(RealtorGuard)
  addCollectionItem(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.collections.addItem(user.id, id, CollectionAddItemSchema.parse(body).listingId);
  }

  @Delete('collections/:id/items/:listingId')
  @UseGuards(RealtorGuard)
  removeCollectionItem(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Param('listingId') listingId: string,
  ) {
    return this.collections.removeItem(user.id, id, listingId);
  }

  @Patch('collections/:id/items')
  @UseGuards(RealtorGuard)
  reorderCollection(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.collections.reorder(user.id, id, CollectionReorderSchema.parse(body).listingIds);
  }
}
