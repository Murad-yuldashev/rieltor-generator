import { queryOptions } from '@tanstack/react-query';
import { ObjectDetailSchema, ObjectListItemSchema } from '@rieltor/shared';
import * as z from 'zod';
import { apiGet } from '@/shared/api/client';

export const objectRoyxatQuery = () =>
  queryOptions({
    queryKey: ['objects'] as const,
    queryFn: () => apiGet('/api/objects', z.array(ObjectListItemSchema)),
  });

export const objectQuery = (id: string) =>
  queryOptions({
    queryKey: ['object', id] as const,
    queryFn: () => apiGet(`/api/objects/${id}`, ObjectDetailSchema),
    // Obyekt ma'lumoti demo davomida o'zgarmaydi.
    staleTime: 5 * 60 * 1000,
  });
