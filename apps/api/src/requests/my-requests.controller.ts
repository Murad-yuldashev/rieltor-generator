import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { RequestsService } from './requests.service';

@Controller('my/requests')
@UseGuards(JwtGuard)
export class MyRequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  listMine(@CurrentUser() user: { id: string }) {
    return this.requests.listMine(user.id);
  }
}
