import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { MortgageProgramSchema } from '@rieltor/shared';
import { apiGet } from '@/shared/api/client';

const ProgramsSchema = z.array(MortgageProgramSchema);

export function useMortgagePrograms() {
  return useQuery({
    queryKey: ['mortgage-programs'] as const,
    queryFn: () => apiGet('/api/mortgage/programs', ProgramsSchema),
    staleTime: 60 * 60 * 1000, // rates rarely change within a session
  });
}
