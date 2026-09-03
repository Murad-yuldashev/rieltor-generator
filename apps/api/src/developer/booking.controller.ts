import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { BookingCreateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { BookingService } from './booking.service';
import { DeveloperGuard } from './developer.guard';

@Controller('crm')
@UseGuards(JwtGuard)
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Post('units/:id/book')
  @UseGuards(DeveloperGuard)
  book(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.booking.book(u.id, id, BookingCreateSchema.parse(body));
  }
}
