import { createZodDto } from 'nestjs-zod';
import { ViewsSchema } from '@rieltor/shared';

export class ViewsDto extends createZodDto(ViewsSchema) {}
