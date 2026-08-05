import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env';
import { createApp } from './create-app';

async function bootstrap() {
  const app = await createApp();

  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void bootstrap();
