// Kebab-slug from an arbitrary name, matching the realtor-slug regex shape.
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 38);
  return base.length >= 3 ? base : `jk-${base}`.slice(0, 40);
}
