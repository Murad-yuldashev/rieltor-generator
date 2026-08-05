/**
 * Details about the agency itself. This is not listing data, so it lives here
 * rather than in the database. The contact page — and any future footer — reads
 * from this single source; changing the phone or Telegram means editing only this file.
 *
 * Note: the seeded realtor's phone comes from the SEED_AGENT_TEL env var, so if
 * that changes, the number here has to be updated to match.
 */
export const AGENCY = {
  name: "O'zbekiston Ko'chmas Mulk",
  about: "O'zbekiston bo'ylab kvartira, hovli va tijorat obyektlari. 2018-yildan beri xizmatdamiz.",
  phone: '+998958581450',
  telegram: 'rieltorapp',
} as const;

/** The "Ko'p so'raladigan savollar" section on the contact page. */
export const FAQ = [
  {
    question: "Obyektni qanday ko'rishga borsam bo'ladi?",
    answer:
      "E'lon sahifasidagi «Qo'ng'iroq» tugmasi orqali rieltor bilan bog'laning — u siz uchun qulay vaqtda ko'rsatuvni tashkil qiladi.",
  },
  {
    question: "E'lonlar tekshiriladimi?",
    answer:
      "Ha, har bir obyekt joylashtirishdan oldin hujjatlari va suratlari bo'yicha tekshiruvdan o'tadi.",
  },
  {
    question: 'Xizmat narxi qancha?',
    answer:
      "Xaridorlar uchun ilova to'liq bepul. Vositachilik shartlari kelishuv asosida belgilanadi.",
  },
] as const;
