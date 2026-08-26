import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { NoteUpsertSchema, RealtorProfileUpdateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
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
}
