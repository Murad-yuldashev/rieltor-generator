/**
 * The search page derives "popular districts" from live listings — fine for
 * browsing, but a seller valuing their own home needs the full list, not
 * just the districts that already have inventory. A static array is the
 * simplest fit; it also keeps this form usable even on an empty database.
 * Naming matches the `district` strings the seed data and the wizard use.
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
