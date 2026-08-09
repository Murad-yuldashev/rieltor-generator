/**
 * Every field the profile endpoints return — and nothing else. Kept in its own file
 * because three modules (auth, auth-dev, realtors) need it and none of them should
 * have to import a controller to get it.
 */
export const REALTOR_SELECT = {
  id: true,
  name: true,
  username: true,
  photoUrl: true,
  phone: true,
  phoneVerified: true,
  agency: true,
  registryNo: true,
  trusted: true,
} as const;
