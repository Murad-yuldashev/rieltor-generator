import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import {
  AuthTokensSchema,
  OtpRequestSchema,
  OtpVerifySchema,
  type AuthTokens,
} from '@rieltor/shared';
import { apiPost } from '@/shared/api/client';
import { writeTokens } from '@/shared/api/auth-storage';

/**
 * `POST /api/auth/otp/request` returns the OTP's TTL, plus — in dev only, until a
 * real SMS provider exists — the code itself (`devCode`) so the modal can prefill it.
 * The server omits `devCode` in production.
 */
const OtpRequestResultSchema = z.object({
  expiresInSec: z.number().int(),
  devCode: z.string().optional(),
});

/**
 * Both mutations end in the same place: store the tokens and make `useSession`
 * refetch. `['session']` is the exact query key `useSession` (entities/session) uses.
 */
function useAuthenticated() {
  const queryClient = useQueryClient();

  return (tokens: AuthTokens) => {
    writeTokens(tokens);
    void queryClient.invalidateQueries({ queryKey: ['session'] });
  };
}

export function useLogin() {
  const onAuthenticated = useAuthenticated();

  const requestOtpMutation = useMutation({
    mutationFn: (phone: string) =>
      apiPost('/api/auth/otp/request', OtpRequestResultSchema, OtpRequestSchema.parse({ phone })),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      apiPost('/api/auth/otp/verify', AuthTokensSchema, OtpVerifySchema.parse({ phone, code })),
    onSuccess: onAuthenticated,
  });

  return {
    requestOtp: (phone: string) => requestOtpMutation.mutateAsync(phone),
    verifyOtp: (phone: string, code: string) => verifyOtpMutation.mutateAsync({ phone, code }),
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    resetVerifyError: verifyOtpMutation.reset,
  };
}
