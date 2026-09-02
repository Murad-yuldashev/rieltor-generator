import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BecomeDeveloperSchema, ComplexCreateSchema, ComplexUpdateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';

@Controller('crm')
@UseGuards(JwtGuard)
export class DeveloperController {
  constructor(private readonly dev: DeveloperService) {}

  // JwtGuard-only: right after the upgrade the caller's JWT still says USER (like become-realtor).
  @Post('become-developer')
  becomeDeveloper(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    const { name, district } = BecomeDeveloperSchema.parse(body);
    return this.dev.becomeDeveloper(u.id, name, district);
  }

  @Get('org')
  @UseGuards(DeveloperGuard)
  org(@CurrentUser() u: { id: string }) {
    return this.dev.orgView(u.id);
  }

  // ---- Complex CRUD (org-scoped) -------------------------------------------

  @Get('complexes')
  @UseGuards(DeveloperGuard)
  listComplexes(@CurrentUser() u: { id: string }) {
    return this.dev.listComplexes(u.id);
  }

  @Post('complexes')
  @UseGuards(DeveloperGuard)
  createComplex(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.createComplex(u.id, ComplexCreateSchema.parse(body));
  }

  @Get('complexes/:id')
  @UseGuards(DeveloperGuard)
  getComplex(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.dev.getComplex(u.id, id);
  }

  @Patch('complexes/:id')
  @UseGuards(DeveloperGuard)
  updateComplex(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.updateComplex(u.id, id, ComplexUpdateSchema.parse(body));
  }

  @Delete('complexes/:id')
  @UseGuards(DeveloperGuard)
  deleteComplex(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.dev.deleteComplex(u.id, id);
  }
}
