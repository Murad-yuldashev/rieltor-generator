import { createZodDto } from 'nestjs-zod';
import { ShareCreateSchema, ShareLinkSchema } from '@rieltor/shared';

export class ShareCreateDto extends createZodDto(ShareCreateSchema) {}
export class ShareLinkDto extends createZodDto(ShareLinkSchema) {}
