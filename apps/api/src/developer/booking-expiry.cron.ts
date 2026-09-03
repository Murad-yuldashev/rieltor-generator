import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingService } from './booking.service';

@Injectable()
export class BookingExpiryCron {
  constructor(private readonly booking: BookingService) {}

  // Top of every hour. Single-instance deploy — see spec §11 for the scale caveat.
  @Cron('0 * * * *')
  run() {
    return this.booking.expireOverdue();
  }
}
