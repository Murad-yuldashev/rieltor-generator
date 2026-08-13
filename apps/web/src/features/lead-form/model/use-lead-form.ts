import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LeadCreateSchema } from '@rieltor/shared';
import * as z from 'zod';
import { createLead } from '../api';

/**
 * name+phone reuse the exact server-side rules (@rieltor/shared's LeadCreateSchema,
 * omitting listingId — that comes from the page, never the visitor) so client-side
 * validation can never drift from what the API actually enforces. `website` (the
 * honeypot) is deliberately unconstrained — it must reach the server exactly as a
 * real visitor left it (empty) or a bot filled it, never rejected client-side.
 */
const LeadFormSchema = LeadCreateSchema.omit({ listingId: true }).extend({
  website: z.string(),
});

type FormState = z.infer<typeof LeadFormSchema>;

const EMPTY: FormState = { name: '', phone: '', website: '' };

export function useLeadForm(listingId: string) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const submission = useMutation({
    mutationFn: (input: FormState) =>
      createLead({ listingId, name: input.name, phone: input.phone }, input.website),
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const parsed = LeadFormSchema.safeParse(form);
    if (!parsed.success) {
      // One message per field, so a bad phone never shows up under "Ism".
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    submission.mutate(parsed.data);
  }

  function reset() {
    setForm(EMPTY);
    setErrors({});
    submission.reset();
  }

  return { form, setField, errors, submit, reset, submission };
}
