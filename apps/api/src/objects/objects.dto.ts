import { createZodDto } from 'nestjs-zod';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';

// Swagger sxemasi shu sinflardan generatsiya qilinadi — tip manbasi baribir @rieltor/shared.
export class ObjectDetailDto extends createZodDto(ObjectDetailSchema) {}
export class ObjectListItemDto extends createZodDto(ObjectListItemSchema) {}
