/**
 * The Tashkent districts, as the exact strings the seed data, the listing
 * wizard, and the valuation form all use. A static list keeps a district
 * `<select>` usable even on an empty database — the search page derives its
 * districts from live listings, which is fine for browsing but too sparse for a
 * form or a board filter. Lives in shared so the valuation form and the
 * "Qidiryapman" board filter read one source and can never drift apart.
 */
export const TASHKENT_DISTRICTS = [
  'Bektemir tumani',
  'Chilonzor tumani',
  'Mirobod tumani',
  "Mirzo Ulug'bek tumani",
  'Olmazor tumani',
  'Sergeli tumani',
  'Shayxontohur tumani',
  'Uchtepa tumani',
  'Yakkasaroy tumani',
  'Yashnobod tumani',
  'Yunusobod tumani',
] as const;
