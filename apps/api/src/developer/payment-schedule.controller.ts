import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentScheduleCreateSchema, PaymentRecordSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperService } from './developer.service';
import { DeveloperGuard } from './developer.guard';
import { PaymentScheduleService } from './payment-schedule.service';

@Controller('crm')
@UseGuards(JwtGuard, DeveloperGuard)
export class PaymentScheduleController {
  constructor(
    private readonly schedules: PaymentScheduleService,
    private readonly developer: DeveloperService,
  ) {}

  @Post('contracts/:id/schedule')
  async create(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    const input = PaymentScheduleCreateSchema.parse(body);
    return this.schedules.create(await this.developer.orgIdOf(u.id), id, input);
  }

  @Get('contracts/:id/schedule')
  async get(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    return this.schedules.getForContract(await this.developer.orgIdOf(u.id), id);
  }

  @Delete('contracts/:id/schedule')
  async remove(@CurrentUser() u: { id: string }, @Param('id') id: string) {
    await this.schedules.remove(await this.developer.orgIdOf(u.id), id);
    return { ok: true };
  }

  @Post('installments/:id/pay')
  async pay(@CurrentUser() u: { id: string }, @Param('id') id: string, @Body() body: unknown) {
    const { note } = PaymentRecordSchema.parse(body);
    return this.schedules.pay(await this.developer.orgIdOf(u.id), id, note, u.id);
  }
}
