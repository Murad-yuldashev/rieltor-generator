import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { RequestWithRealtor } from './realtor.guard';

/** Only valid on a handler behind RealtorGuard, which is what fills realtorId in. */
export const CurrentRealtor = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithRealtor>();
  return request.realtorId as string;
});
