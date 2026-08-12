/**
 * +998901234567 → "+998 90 123 45 67". Any other shape is returned untouched.
 *
 * Deliberately a local copy of entities/agent's formatPhone rather than an import:
 * FSD boundaries only let an entity depend on `shared`, never on a sibling entity
 * (see eslint.config.mjs's boundaries/dependencies policy), so the two small
 * formatters live side by side instead of one entity reaching into another.
 */
export function formatPhone(phone: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
