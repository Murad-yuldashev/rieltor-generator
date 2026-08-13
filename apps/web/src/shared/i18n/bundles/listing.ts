import type { I18nBundle } from '@/shared/i18n';

/**
 * Strings for the listing detail page and the widgets/entities/features that only
 * ever appear there: pages/listing, widgets/gallery, widgets/sticky-cta,
 * widgets/realtor-cta, entities/agent, features/lead-form. `common` covers the
 * generic words (close, back, …) reused across all of these.
 */
export const listingI18n: I18nBundle = {
  ns: 'listing',
  uz: {
    'listingPage.loadError': "Obyektni yuklab bo'lmadi.",
    'listingPage.descriptionTitle': 'Tavsif',
    'listingPage.locationTitle': 'Joylashuv',

    'gallery.share': 'Ulashish',
    'gallery.thumbnailsLabel': 'Rasmlar',
    'gallery.slideLabel': '{{number}}-rasm',
    'gallery.counter': '{{current}}/{{total}}',

    'stickyCta.call': "Qo'ng'iroq",
    'stickyCta.telegram': 'Telegram',
    'stickyCta.leaveNumber': 'Raqamimni qoldiraman',

    'realtorCta.pitch': "O'z e'lonlaringizni joylang va mijozlarga bir bosishda yeting.",
    'realtorCta.cta': "Rieltor bo'lmoqchimisiz?",

    'agent.verifiedBadge': '✓ TEKSHIRILGAN',

    'leadForm.title': 'Raqamingizni qoldiring',
    'leadForm.description':
      "Ismingiz va telefon raqamingizni qoldiring — rieltor siz bilan bog'lanadi.",
    'leadForm.nameLabel': 'Ism',
    'leadForm.namePlaceholder': 'Ismingiz',
    'leadForm.phoneLabel': 'Telefon',
    'leadForm.phonePlaceholder': '+998901234567',
    'leadForm.submit': 'Yuborish',
    'leadForm.submitting': 'Yuborilmoqda…',
    'leadForm.successMessage': "Rahmat, tez orada bog'lanamiz",
    'leadForm.error.duplicate': "Bu e'lon uchun so'rovingiz allaqachon qabul qilingan.",
    'leadForm.error.notFound': "Bu e'lon endi mavjud emas.",
    'leadForm.error.generic': "Yuborishda xatolik yuz berdi. Qayta urinib ko'ring.",
  },
  ru: {
    'listingPage.loadError': 'Не удалось загрузить объект.',
    'listingPage.descriptionTitle': 'Описание',
    'listingPage.locationTitle': 'Расположение',

    'gallery.share': 'Поделиться',
    'gallery.thumbnailsLabel': 'Фотографии',
    'gallery.slideLabel': 'Фото {{number}}',
    'gallery.counter': '{{current}}/{{total}}',

    'stickyCta.call': 'Позвонить',
    'stickyCta.telegram': 'Telegram',
    'stickyCta.leaveNumber': 'Оставить номер',

    'realtorCta.pitch': 'Размещайте свои объявления и находите клиентов в один клик.',
    'realtorCta.cta': 'Хотите стать риелтором?',

    'agent.verifiedBadge': '✓ ПРОВЕРЕН',

    'leadForm.title': 'Оставьте свой номер',
    'leadForm.description': 'Оставьте имя и номер телефона — риелтор свяжется с вами.',
    'leadForm.nameLabel': 'Имя',
    'leadForm.namePlaceholder': 'Ваше имя',
    'leadForm.phoneLabel': 'Телефон',
    'leadForm.phonePlaceholder': '+998901234567',
    'leadForm.submit': 'Отправить',
    'leadForm.submitting': 'Отправка…',
    'leadForm.successMessage': 'Спасибо, скоро свяжемся с вами',
    'leadForm.error.duplicate': 'Ваша заявка на этот объект уже принята.',
    'leadForm.error.notFound': 'Этого объекта больше не существует.',
    'leadForm.error.generic': 'Ошибка при отправке. Попробуйте ещё раз.',
  },
  en: {
    'listingPage.loadError': 'Failed to load the listing.',
    'listingPage.descriptionTitle': 'Description',
    'listingPage.locationTitle': 'Location',

    'gallery.share': 'Share',
    'gallery.thumbnailsLabel': 'Photos',
    'gallery.slideLabel': 'Photo {{number}}',
    'gallery.counter': '{{current}}/{{total}}',

    'stickyCta.call': 'Call',
    'stickyCta.telegram': 'Telegram',
    'stickyCta.leaveNumber': 'Leave my number',

    'realtorCta.pitch': 'List your properties and reach clients in one tap.',
    'realtorCta.cta': 'Want to become a realtor?',

    'agent.verifiedBadge': '✓ VERIFIED',

    'leadForm.title': 'Leave your number',
    'leadForm.description': "Leave your name and phone number — the realtor will contact you.",
    'leadForm.nameLabel': 'Name',
    'leadForm.namePlaceholder': 'Your name',
    'leadForm.phoneLabel': 'Phone',
    'leadForm.phonePlaceholder': '+998901234567',
    'leadForm.submit': 'Submit',
    'leadForm.submitting': 'Submitting…',
    'leadForm.successMessage': "Thank you, we'll be in touch soon",
    'leadForm.error.duplicate': 'Your request for this listing has already been received.',
    'leadForm.error.notFound': 'This listing no longer exists.',
    'leadForm.error.generic': 'Something went wrong while submitting. Please try again.',
  },
};
