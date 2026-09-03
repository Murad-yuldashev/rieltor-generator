import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RequestsService } from '../requests/requests.service';
import { ComplexesPublicController } from './complexes-public.controller';
import { ComplexesPublicService } from './complexes-public.service';

// PrismaModule is @Global, so it needs no importing here. The list/detail reads are
// unguarded and slug-gated; AuthModule supplies JwtService/JwtGuard for the single
// method-level @UseGuards(JwtGuard) on the inquiry write. RequestsService is provided
// directly (it only depends on the global Prisma) so the inquiry can mint a scored lead
// without touching RequestsModule's provider set.
@Module({
  imports: [AuthModule],
  controllers: [ComplexesPublicController],
  providers: [ComplexesPublicService, RequestsService],
})
export class ComplexesPublicModule {}
