import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrackedPropertyDetailSchema,
  TrackedPropertySchema,
  type TrackedPropertyCreate,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiDelete, apiGet, apiPost } from '@/shared/api/client';

export const trackedPropertiesQuery = () =>
  queryOptions({
    queryKey: ['tracked-properties'] as const,
    queryFn: () => apiGet('/api/my/properties', z.array(TrackedPropertySchema)),
  });

export const trackedPropertyQuery = (id: string) =>
  queryOptions({
    queryKey: ['tracked-property', id] as const,
    queryFn: () => apiGet(`/api/my/properties/${id}`, TrackedPropertyDetailSchema),
  });

export function useCreateTrackedProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TrackedPropertyCreate) =>
      apiPost('/api/my/properties', TrackedPropertyDetailSchema, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracked-properties'] }),
  });
}

export async function deleteTrackedProperty(id: string) {
  await apiDelete(`/api/my/properties/${id}`);
}
