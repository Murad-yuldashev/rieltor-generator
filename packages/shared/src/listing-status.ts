import * as z from 'zod';

export const ListingStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'ACTIVE',
  'RESERVED',
  'SOLD',
  'RENTED',
  'ARCHIVED',
]);

export type ListingStatus = z.infer<typeof ListingStatusSchema>;

/** Who is asking for the transition. Admin has moderation-only powers. */
export type ListingRole = 'realtor' | 'admin';

/**
 * The lifecycle table from the design (§7.4) as a pure lookup: status + role in,
 * the statuses that role may move to next out. Two rules live in the service, not
 * here, because they need data this function cannot see:
 *   - a DRAFT→ACTIVE ("publish") request lands on PENDING when the realtor is not
 *     yet trusted — that is why the realtor's only DRAFT move is ['ACTIVE'];
 *   - SOLD/RENTED→ACTIVE is allowed only inside a 48-hour undo window.
 */
export function allowedTransitions(status: ListingStatus, role: ListingRole): ListingStatus[] {
  const realtor: Partial<Record<ListingStatus, ListingStatus[]>> = {
    DRAFT: ['ACTIVE'],
    PENDING: ['DRAFT'],
    ACTIVE: ['RESERVED', 'SOLD', 'RENTED', 'ARCHIVED'],
    RESERVED: ['ACTIVE', 'SOLD', 'RENTED', 'ARCHIVED'],
    SOLD: ['ACTIVE'],
    RENTED: ['ACTIVE'],
    ARCHIVED: ['ACTIVE'],
  };

  const admin: Partial<Record<ListingStatus, ListingStatus[]>> = {
    PENDING: ['ACTIVE', 'DRAFT'],
  };

  const table = role === 'admin' ? admin : realtor;
  return table[status] ?? [];
}
