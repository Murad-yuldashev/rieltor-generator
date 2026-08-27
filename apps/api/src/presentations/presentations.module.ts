import { Module } from '@nestjs/common';
import { PresentationsService } from './presentations.service';
import { PublicPresentationController } from './public-presentation.controller';

// PrismaModule is @Global and ConfigModule is registered globally in AppModule,
// so neither needs importing here. The public controller (GET /api/p/:token +
// POST /api/p/:token/view) is unguarded and token-gated. AgentModule imports this
// module for the realtor-facing routes.
@Module({
  controllers: [PublicPresentationController],
  providers: [PresentationsService],
  exports: [PresentationsService],
})
export class PresentationsModule {}
