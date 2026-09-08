import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentScheduleViewSchema, type PaymentScheduleCreate } from '@rieltor/shared';
import { apiDelete, apiGet, apiPost } from '@/shared/api/client';

const key = (contractId: string) => ['crm-schedule', contractId] as const;
const NullableSchedule = PaymentScheduleViewSchema.nullable();

/** A contract's payment schedule (`GET /api/crm/contracts/:id/schedule`) — `null` when none exists yet. */
export function usePaymentSchedule(contractId: string) {
  return useQuery({
    queryKey: key(contractId),
    queryFn: () => apiGet(`/api/crm/contracts/${contractId}/schedule`, NullableSchedule),
  });
}

/** Generate the schedule (`POST /api/crm/contracts/:id/schedule`) — repaints the schedule query. */
export function useCreateSchedule(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentScheduleCreate) =>
      apiPost(`/api/crm/contracts/${contractId}/schedule`, PaymentScheduleViewSchema, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(contractId) }),
  });
}

/** Stub-pay one installment (`POST /api/crm/installments/:id/pay`) — returns the repainted schedule. */
export function usePayInstallment(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installmentId: string) =>
      apiPost(`/api/crm/installments/${installmentId}/pay`, PaymentScheduleViewSchema, {}),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(contractId) }),
  });
}

/** Delete the schedule (`DELETE /api/crm/contracts/:id/schedule`) — allowed only while nothing is paid. */
export function useDeleteSchedule(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete(`/api/crm/contracts/${contractId}/schedule`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key(contractId) }),
  });
}
