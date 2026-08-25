import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationListSchema } from '@rieltor/shared';
import { apiGet, apiPost } from '@/shared/api/client';

export const notificationsQuery = () =>
  queryOptions({
    queryKey: ['notifications'] as const,
    queryFn: () => apiGet('/api/my/notifications', NotificationListSchema),
  });

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost('/api/my/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
