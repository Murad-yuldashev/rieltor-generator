import { Module } from '@nestjs/common';
import { PresentationsService } from './presentations.service';

// PrismaModule is @Global and ConfigModule is registered globally in AppModule,
// so neither needs importing here. The public controller lands in Task 4, also
// in this module. AgentModule imports this for the realtor-facing routes.
@Module({
  providers: [PresentationsService],
  exports: [PresentationsService],
})
export class PresentationsModule {}
