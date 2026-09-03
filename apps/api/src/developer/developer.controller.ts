import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  BecomeDeveloperSchema,
  BuildingCreateSchema,
  BuildingUpdateSchema,
  ComplexCreateSchema,
  ComplexUpdateSchema,
  UnitBulkUpdateSchema,
  UnitCreateSchema,
  UnitUpdateSchema,
} from '@rieltor/shared';
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

  // ---- Building CRUD (org-scoped via the complex) --------------------------

  @Post('complexes/:id/buildings')
  @UseGuards(DeveloperGuard)
  createBuilding(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.createBuilding(u.id, id, BuildingCreateSchema.parse(body));
  }

  @Patch('buildings/:id')
  @UseGuards(DeveloperGuard)
  updateBuilding(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.updateBuilding(u.id, id, BuildingUpdateSchema.parse(body));
  }

  @Delete('buildings/:id')
  @UseGuards(DeveloperGuard)
  deleteBuilding(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.dev.deleteBuilding(u.id, id);
  }

  // ---- Unit CRUD (org-scoped via building -> complex) ----------------------

  @Get('buildings/:id/units')
  @UseGuards(DeveloperGuard)
  listUnits(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.dev.listUnits(u.id, id);
  }

  @Post('buildings/:id/units')
  @UseGuards(DeveloperGuard)
  createUnit(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.createUnit(u.id, id, UnitCreateSchema.parse(body));
  }

  // Declared BEFORE `units/:id`: Nest matches routes in declaration order, so the literal
  // `units/bulk` must come first or `PATCH units/bulk` is captured as `units/:id` with id='bulk'.
  @Patch('units/bulk')
  @UseGuards(DeveloperGuard)
  bulkUpdateUnits(@CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.bulkUpdateUnits(u.id, UnitBulkUpdateSchema.parse(body));
  }

  @Patch('units/:id')
  @UseGuards(DeveloperGuard)
  updateUnit(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() body: unknown) {
    return this.dev.updateUnit(u.id, id, UnitUpdateSchema.parse(body));
  }

  @Delete('units/:id')
  @UseGuards(DeveloperGuard)
  deleteUnit(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.dev.deleteUnit(u.id, id);
  }
}
