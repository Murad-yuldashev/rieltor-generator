import type { I18nBundle } from '@/shared/i18n';

/**
 * Strings for the slices too small (or too spread out) to warrant a namespace of
 * their own: the public realtor showcase (`/r/:username`) and its `entities/realtor`
 * card/badge, the header location chip + map picker, the contact/FAQ page, the
 * public offer page, and the 404 page/widget. See each `uz` entry for the exact
 * source text; `ru`/`en` are natural translations, not literal ones.
 */
export const miscI18n: I18nBundle = {
  ns: 'misc',
  uz: {
    // entities/realtor: card + sold/rented badge
    call: "Qo'ng'iroq",
    telegram: 'Telegram',
    verifiedTelegram: 'Tasdiqlangan Telegram',
    registryNumber: 'Reestr raqami: {{registryNo}}',
    callAriaLabel: "Qo'ng'iroq qilish: {{phone}}",
    soldInDays: '{{n}} kunda sotilgan',
    rentedInDays: '{{n}} kunda ijaraga berilgan',

    // pages/realtor-showcase
    realtorNotFoundTitle: 'Bunday rieltor topilmadi',
    realtorNotFoundSubtitle: "Havola eskirgan yoki foydalanuvchi nomi noto'g'ri.",
    realtorLoadError: "Rieltor ma'lumotini yuklab bo'lmadi.",
    activeListings: "Faol e'lonlar",
    noActiveListings: "Hozircha faol e'lonlar yo'q.",
    soldObjects: 'Sotilgan obyektlar',

    // features/user-location: header chip + map picker sheet
    chooseLocation: 'Joyni tanlash',
    locating: 'Aniqlanmoqda…',
    chooseYourLocationHeading: 'Joyingizni tanlang',
    mapLoadError: "Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring.",
    mapNotConfigured: 'Xarita sozlanmagan.',
    findMe: 'Meni topish',
    chooseThisPlace: 'Shu yerni tanlash',

    // pages/contact
    contactSubtitle: "Savollaringiz bo'lsa — bemalol yozing",
    agencyName: "O'zbekiston Ko'chmas Mulk",
    agencyAbout:
      "O'zbekiston bo'ylab kvartira, hovli va tijorat obyektlari. 2018-yildan beri xizmatdamiz.",
    offerLinkSubtitle: 'Xizmatdan foydalanish shartlari',
    forRealtors: 'Rieltor uchun',
    forRealtorsSubtitle: "O'z e'lonlaringizni joylang",
    'faq.title': "Ko'p so'raladigan savollar",
    'faq.q1': "Obyektni qanday ko'rishga borsam bo'ladi?",
    'faq.a1':
      "E'lon sahifasidagi «Qo'ng'iroq» tugmasi orqali rieltor bilan bog'laning — u siz uchun qulay vaqtda ko'rsatuvni tashkil qiladi.",
    'faq.q2': "E'lonlar tekshiriladimi?",
    'faq.a2':
      "Ha, har bir obyekt joylashtirishdan oldin hujjatlari va suratlari bo'yicha tekshiruvdan o'tadi.",
    'faq.q3': 'Xizmat narxi qancha?',
    'faq.a3': "Xaridorlar uchun ilova to'liq bepul. Vositachilik shartlari kelishuv asosida belgilanadi.",

    // pages/offer — a long legal-ish text kept as one multi-line string per section
    // (joined with .join('\n'), split back with .split('\n') on render) rather than
    // one key per list item.
    'offer.title': 'Ommaviy oferta',
    'offer.updatedAt': 'Oxirgi tahrir: 2026-yil 5-avgust',
    'offer.intro':
      "Ushbu hujjat RieltorApp ilovasi ma'muriyati tomonidan taqdim etiladigan xizmatlardan foydalanish shartlarini belgilovchi ommaviy oferta hisoblanadi. Ilovadan foydalanishni boshlashdan oldin uni to'liq o'qib chiqishingizni so'raymiz.",

    'offer.section1Title': '1. Umumiy qoidalar',
    'offer.section1Items': [
      "Ushbu ommaviy oferta (keyingi o'rinlarda — «Oferta») RieltorApp axborot platformasi (keyingi o'rinlarda — «Ilova») ma'muriyatining noma'lum doiradagi shaxslarga qaratilgan taklifi hisoblanadi.",
      "Ilovadan foydalanishni boshlash Oferta shartlarini to'liq va so'zsiz qabul qilish (aksept) deb hisoblanadi. Shartlarga rozi bo'lmasangiz, Ilovadan foydalanishdan voz keching.",
      "Ma'muriyat Oferta shartlarini bir tomonlama tartibda o'zgartirish huquqiga ega. Yangi tahrir Ilovada e'lon qilingan kundan e'tiboran kuchga kiradi.",
      "Foydalanuvchi Oferta joriy tahririni vaqti-vaqti bilan ko'rib turish majburiyatini oladi.",
    ].join('\n'),

    'offer.section2Title': '2. Atamalar',
    'offer.section2Items': [
      "«Ilova» — ko'chmas mulk obyektlari haqidagi e'lonlarni joylashtirish va ko'rish imkonini beruvchi RieltorApp axborot platformasi.",
      "«Ma'muriyat» — Ilovaning ishlashini ta'minlovchi va uni boshqaruvchi shaxs.",
      '«Foydalanuvchi» — Ilovadan foydalanuvchi har qanday jismoniy yoki yuridik shaxs.',
      "«E'lon» — Ilovada joylashtirilgan ko'chmas mulk obyekti haqidagi ma'lumot: narx, maydon, joylashuv, suratlar va tavsif.",
      "«Rieltor» — e'lonni joylashtirgan va obyekt bo'yicha bitim tuzishda ishtirok etuvchi vositachi yoki mulk egasi.",
    ].join('\n'),

    'offer.section3Title': '3. Xizmat predmeti',
    'offer.section3Items': [
      "Ilova ko'chmas mulk obyektlari haqida axborot taqdim etadi va Foydalanuvchini Rieltor bilan bog'lanish imkoni bilan ta'minlaydi.",
      "Ilova axborot xizmati ko'rsatadi. U oldi-sotdi, ijara yoki boshqa bitimning tarafi hisoblanmaydi va bitim bo'yicha vositachi sifatida chiqmaydi.",
      "Bitimning barcha shartlari — narx, to'lov tartibi, hujjatlarni rasmiylashtirish muddati — Foydalanuvchi va Rieltor (yoki mulk egasi) o'rtasida bevosita kelishiladi.",
      'Ilova bitim tuzilishini, obyektning sotilishini yoki ijaraga berilishini kafolatlamaydi.',
    ].join('\n'),

    'offer.section4Title': '4. Xizmat narxi',
    'offer.section4Items': [
      "Xaridor va ijarachi uchun Ilovadan foydalanish — e'lonlarni ko'rish, qidirish, saqlash va Rieltor bilan bog'lanish — to'liq bepul.",
      "Rieltor xizmatlari haqi va vositachilik to'lovi Ilovaga aloqador emas; ular Foydalanuvchi va Rieltor o'rtasidagi alohida kelishuv asosida belgilanadi.",
      "Ma'muriyat kelajakda e'lon joylashtiruvchilar uchun pullik xizmatlar joriy etishi mumkin. Bu haqda oldindan Ilovada xabar beriladi.",
    ].join('\n'),

    'offer.section5Title': '5. Foydalanuvchining huquq va majburiyatlari',
    'offer.section5Items': [
      "Foydalanuvchi Ilovadagi ma'lumotlardan shaxsiy, notijorat maqsadlarda cheklovsiz foydalanish huquqiga ega.",
      'Foydalanuvchi bitim tuzishdan oldin obyektning haqiqiy holatini, mulk egasining huquqini va hujjatlarni mustaqil ravishda tekshirish majburiyatini oladi.',
      "Ilova kontentini avtomatlashtirilgan usulda yig'ish (parsing), ommaviy nusxalash va tijorat maqsadida qayta tarqatish taqiqlanadi.",
      "Foydalanuvchi Ilovaning ishiga xalaqit beruvchi harakatlar qilmaslik, yolg'on ma'lumot bermaslik va uchinchi shaxslar huquqlarini buzmaslik majburiyatini oladi.",
    ].join('\n'),

    'offer.section6Title': "6. Ma'muriyatning huquq va majburiyatlari",
    'offer.section6Items': [
      "Ma'muriyat e'lonlarni joylashtirishdan oldin hujjatlar va suratlar bo'yicha tekshiruvdan o'tkazadi.",
      "Tekshiruvga qaramay, Ma'muriyat uchinchi shaxslardan olingan ma'lumotlarning to'liq aniqligi va dolzarbligiga kafolat bermaydi.",
      "Ma'muriyat Oferta shartlarini buzgan e'lonni olib tashlash yoki Foydalanuvchining Ilovadan foydalanishini cheklash huquqiga ega.",
      "Texnik ishlar yoki Ma'muriyatga bog'liq bo'lmagan sabablarga ko'ra Ilova ishi vaqtincha to'xtatilishi mumkin.",
    ].join('\n'),

    'offer.section7Title': '7. Javobgarlik',
    'offer.section7Items': [
      "Ma'muriyat e'lon egasi tomonidan taqdim etilgan ma'lumotlarning to'g'riligi, obyektning haqiqiy holati va bitim natijasi uchun javobgar emas.",
      "Ma'muriyat Foydalanuvchi va Rieltor o'rtasidagi munosabatlardan kelib chiqadigan har qanday zarar uchun javobgarlik ko'tarmaydi.",
      "Ilovada ko'rsatilgan narx, maydon, qavat va boshqa parametrlar ma'lumot uchun berilgan. Yakuniy qiymat va shartlar bitim vaqtida aniqlanadi.",
      "Ilovadagi valyuta kursi va so'mdagi narx taxminiy hisob-kitob uchun bo'lib, rasmiy kurs sifatida qabul qilinmaydi.",
    ].join('\n'),

    'offer.section8Title': "8. Shaxsiy ma'lumotlar",
    'offer.section8Items': [
      "Foydalanuvchi Ilovadan foydalanish orqali o'z ma'lumotlarining Oferta doirasida qayta ishlanishiga rozilik bildiradi.",
      "Ma'lumotlar O'zbekiston Respublikasining «Shaxsiy ma'lumotlar to'g'risida»gi qonuni talablariga muvofiq qayta ishlanadi va saqlanadi.",
      "Saqlangan (sevimli) e'lonlar va qidiruv tarixi faqat Foydalanuvchining qurilmasida saqlanadi hamda serverga yuborilmaydi. Brauzer ma'lumotlari tozalanganda ular ham o'chadi.",
      "Ma'muriyat Foydalanuvchi ma'lumotlarini uchinchi shaxslarga tijorat maqsadida bermaydi.",
    ].join('\n'),

    'offer.section9Title': '9. Nizolarni hal qilish',
    'offer.section9Items': [
      "Taraflar o'rtasidagi nizolar avvalo muzokaralar yo'li bilan hal qilinadi.",
      "Kelishuvga erishilmagan taqdirda nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sud tartibida ko'rib chiqiladi.",
      "Ushbu Oferta bo'yicha munosabatlarga O'zbekiston Respublikasi moddiy huquqi qo'llaniladi.",
    ].join('\n'),

    'offer.section10Title': '10. Yakuniy qoidalar',
    'offer.section10Items': [
      "Oferta Ilovada e'lon qilingan paytdan boshlab muddatsiz amal qiladi.",
      "Oferta bandlaridan birortasi haqiqiy emas deb topilsa, bu qolgan bandlarning haqiqiyligiga ta'sir qilmaydi.",
      "Oferta bo'yicha savollar yuzasidan «Aloqa» sahifasidagi kontaktlar orqali murojaat qilishingiz mumkin.",
    ].join('\n'),

    // widgets/not-found (defaults; a caller like the realtor showcase overrides them)
    notFoundTitle: 'Bunday obyekt topilmadi',
    notFoundSubtitle: "Havola eskirgan yoki e'lon olib tashlangan.",
    notFoundLinkLabel: 'Barcha obyektlar',
  },
  ru: {
    call: 'Позвонить',
    telegram: 'Telegram',
    verifiedTelegram: 'Подтверждён в Telegram',
    registryNumber: 'Номер реестра: {{registryNo}}',
    callAriaLabel: 'Позвонить: {{phone}}',
    soldInDays: 'Продано за {{n}} дн.',
    rentedInDays: 'Сдано за {{n}} дн.',

    realtorNotFoundTitle: 'Такой риелтор не найден',
    realtorNotFoundSubtitle: 'Ссылка устарела или имя пользователя указано неверно.',
    realtorLoadError: 'Не удалось загрузить данные риелтора.',
    activeListings: 'Активные объявления',
    noActiveListings: 'Пока нет активных объявлений.',
    soldObjects: 'Проданные объекты',

    chooseLocation: 'Выбрать место',
    locating: 'Определяется…',
    chooseYourLocationHeading: 'Выберите ваше местоположение',
    mapLoadError: 'Не удалось загрузить карту. Попробуйте позже.',
    mapNotConfigured: 'Карта не настроена.',
    findMe: 'Найти меня',
    chooseThisPlace: 'Выбрать это место',

    contactSubtitle: 'Есть вопросы — смело пишите',
    agencyName: 'Недвижимость Узбекистана',
    agencyAbout:
      'Квартиры, дома и коммерческие объекты по всему Узбекистану. Работаем с 2018 года.',
    offerLinkSubtitle: 'Условия использования сервиса',
    forRealtors: 'Для риелторов',
    forRealtorsSubtitle: 'Размещайте свои объявления',
    'faq.title': 'Часто задаваемые вопросы',
    'faq.q1': 'Как записаться на просмотр объекта?',
    'faq.a1':
      'Свяжитесь с риелтором через кнопку «Позвонить» на странице объявления — он организует просмотр в удобное для вас время.',
    'faq.q2': 'Проверяются ли объявления?',
    'faq.a2': 'Да, каждый объект перед публикацией проходит проверку документов и фотографий.',
    'faq.q3': 'Сколько стоит услуга?',
    'faq.a3':
      'Для покупателей приложение полностью бесплатно. Условия посредничества определяются по договорённости.',

    'offer.title': 'Публичная оферта',
    'offer.updatedAt': 'Последнее обновление: 5 августа 2026 г.',
    'offer.intro':
      'Настоящий документ представляет собой публичную оферту, определяющую условия использования услуг, предоставляемых администрацией приложения RieltorApp. Просим вас полностью ознакомиться с ним перед началом использования Приложения.',

    'offer.section1Title': '1. Общие положения',
    'offer.section1Items': [
      'Настоящая публичная оферта (далее — «Оферта») является предложением администрации информационной платформы RieltorApp (далее — «Приложение»), адресованным неограниченному кругу лиц.',
      'Начало использования Приложения означает полное и безоговорочное принятие (акцепт) условий Оферты. Если вы не согласны с условиями, откажитесь от использования Приложения.',
      'Администрация вправе в одностороннем порядке изменять условия Оферты. Новая редакция вступает в силу с момента её публикации в Приложении.',
      'Пользователь обязуется периодически знакомиться с действующей редакцией Оферты.',
    ].join('\n'),

    'offer.section2Title': '2. Термины',
    'offer.section2Items': [
      '«Приложение» — информационная платформа RieltorApp, позволяющая размещать и просматривать объявления об объектах недвижимости.',
      '«Администрация» — лицо, обеспечивающее работу Приложения и управляющее им.',
      '«Пользователь» — любое физическое или юридическое лицо, использующее Приложение.',
      '«Объявление» — размещённая в Приложении информация об объекте недвижимости: цена, площадь, местоположение, фотографии и описание.',
      '«Риелтор» — посредник или собственник имущества, разместивший объявление и участвующий в заключении сделки по объекту.',
    ].join('\n'),

    'offer.section3Title': '3. Предмет услуги',
    'offer.section3Items': [
      'Приложение предоставляет информацию об объектах недвижимости и даёт Пользователю возможность связаться с Риелтором.',
      'Приложение оказывает информационную услугу. Оно не является стороной купли-продажи, аренды или иной сделки и не выступает посредником по сделке.',
      'Все условия сделки — цена, порядок оплаты, сроки оформления документов — согласовываются напрямую между Пользователем и Риелтором (или собственником имущества).',
      'Приложение не гарантирует заключение сделки, продажу или сдачу объекта в аренду.',
    ].join('\n'),

    'offer.section4Title': '4. Стоимость услуги',
    'offer.section4Items': [
      'Для покупателя и арендатора использование Приложения — просмотр, поиск, сохранение объявлений и связь с Риелтором — полностью бесплатно.',
      'Оплата услуг Риелтора и комиссия за посредничество не относятся к Приложению; они определяются отдельным соглашением между Пользователем и Риелтором.',
      'В будущем Администрация может ввести платные услуги для лиц, размещающих объявления. Об этом будет заранее сообщено в Приложении.',
    ].join('\n'),

    'offer.section5Title': '5. Права и обязанности Пользователя',
    'offer.section5Items': [
      'Пользователь вправе без ограничений использовать информацию в Приложении в личных, некоммерческих целях.',
      'Перед заключением сделки Пользователь обязуется самостоятельно проверить фактическое состояние объекта, права собственника и документы.',
      'Автоматизированный сбор контента Приложения (парсинг), массовое копирование и распространение в коммерческих целях запрещены.',
      'Пользователь обязуется не совершать действий, нарушающих работу Приложения, не предоставлять ложные сведения и не нарушать права третьих лиц.',
    ].join('\n'),

    'offer.section6Title': '6. Права и обязанности Администрации',
    'offer.section6Items': [
      'Перед публикацией объявлений Администрация проводит проверку документов и фотографий.',
      'Несмотря на проверку, Администрация не гарантирует полную точность и актуальность сведений, полученных от третьих лиц.',
      'Администрация вправе удалить объявление, нарушающее условия Оферты, или ограничить Пользователю доступ к Приложению.',
      'Работа Приложения может быть временно приостановлена в связи с техническими работами или по причинам, не зависящим от Администрации.',
    ].join('\n'),

    'offer.section7Title': '7. Ответственность',
    'offer.section7Items': [
      'Администрация не несёт ответственности за достоверность сведений, предоставленных владельцем объявления, за фактическое состояние объекта и за результат сделки.',
      'Администрация не несёт ответственности за какой-либо ущерб, возникший из отношений между Пользователем и Риелтором.',
      'Указанные в Приложении цена, площадь, этаж и другие параметры приводятся в информационных целях. Окончательные значения и условия определяются на момент сделки.',
      'Курс валюты и цена в сумах, указанные в Приложении, приведены для приблизительного расчёта и не принимаются в качестве официального курса.',
    ].join('\n'),

    'offer.section8Title': '8. Персональные данные',
    'offer.section8Items': [
      'Используя Приложение, Пользователь даёт согласие на обработку своих данных в рамках настоящей Оферты.',
      'Данные обрабатываются и хранятся в соответствии с требованиями Закона Республики Узбекистан «О персональных данных».',
      'Сохранённые (избранные) объявления и история поиска хранятся только на устройстве Пользователя и не передаются на сервер. При очистке данных браузера они также удаляются.',
      'Администрация не передаёт данные Пользователя третьим лицам в коммерческих целях.',
    ].join('\n'),

    'offer.section9Title': '9. Разрешение споров',
    'offer.section9Items': [
      'Споры между сторонами разрешаются прежде всего путём переговоров.',
      'При недостижении согласия спор рассматривается в судебном порядке в соответствии с законодательством Республики Узбекистан.',
      'К отношениям по настоящей Оферте применяется материальное право Республики Узбекистан.',
    ].join('\n'),

    'offer.section10Title': '10. Заключительные положения',
    'offer.section10Items': [
      'Оферта действует бессрочно с момента её публикации в Приложении.',
      'Если какой-либо пункт Оферты будет признан недействительным, это не влияет на действительность остальных пунктов.',
      'По вопросам, связанным с Офертой, вы можете обратиться через контакты на странице «Контакты».',
    ].join('\n'),

    notFoundTitle: 'Такой объект не найден',
    notFoundSubtitle: 'Ссылка устарела или объявление снято с публикации.',
    notFoundLinkLabel: 'Все объекты',
  },
  en: {
    call: 'Call',
    telegram: 'Telegram',
    verifiedTelegram: 'Verified on Telegram',
    registryNumber: 'Registry No.: {{registryNo}}',
    callAriaLabel: 'Call: {{phone}}',
    soldInDays: 'Sold in {{n}} days',
    rentedInDays: 'Rented in {{n}} days',

    realtorNotFoundTitle: 'Realtor not found',
    realtorNotFoundSubtitle: "The link is outdated or the username is incorrect.",
    realtorLoadError: "Couldn't load the realtor's information.",
    activeListings: 'Active listings',
    noActiveListings: 'No active listings yet.',
    soldObjects: 'Sold properties',

    chooseLocation: 'Choose location',
    locating: 'Locating…',
    chooseYourLocationHeading: 'Choose your location',
    mapLoadError: "Couldn't load the map. Please try again later.",
    mapNotConfigured: 'Map is not configured.',
    findMe: 'Find me',
    chooseThisPlace: 'Choose this place',

    contactSubtitle: 'Have questions? Feel free to reach out',
    agencyName: 'Uzbekistan Real Estate',
    agencyAbout:
      'Apartments, houses, and commercial properties across Uzbekistan. Serving clients since 2018.',
    offerLinkSubtitle: 'Terms of service',
    forRealtors: 'For realtors',
    forRealtorsSubtitle: 'Post your own listings',
    'faq.title': 'Frequently asked questions',
    'faq.q1': 'How can I arrange a viewing of a property?',
    'faq.a1':
      'Contact the realtor using the "Call" button on the listing page — they will arrange a viewing at a time convenient for you.',
    'faq.q2': 'Are listings verified?',
    'faq.a2': 'Yes, every property is checked for documents and photos before it is published.',
    'faq.q3': 'How much does the service cost?',
    'faq.a3':
      'The app is completely free for buyers. Brokerage terms are set by agreement.',

    'offer.title': 'Public Offer',
    'offer.updatedAt': 'Last updated: August 5, 2026',
    'offer.intro':
      'This document is a public offer that sets out the terms for using the services provided by the administration of the RieltorApp application. Please read it in full before you start using the App.',

    'offer.section1Title': '1. General provisions',
    'offer.section1Items': [
      'This public offer (hereinafter — the "Offer") is a proposal by the administration of the RieltorApp information platform (hereinafter — the "App"), addressed to an unlimited group of persons.',
      "Starting to use the App constitutes full and unconditional acceptance of the Offer's terms. If you do not agree with the terms, please refrain from using the App.",
      'The Administration has the right to unilaterally change the terms of the Offer. The new version takes effect from the day it is published in the App.',
      'The User undertakes to periodically review the current version of the Offer.',
    ].join('\n'),

    'offer.section2Title': '2. Definitions',
    'offer.section2Items': [
      '"App" — the RieltorApp information platform that allows listings for real estate properties to be posted and viewed.',
      '"Administration" — the party that operates and manages the App.',
      '"User" — any individual or legal entity using the App.',
      '"Listing" — information about a real estate property posted in the App: price, area, location, photos, and description.',
      '"Realtor" — the intermediary or property owner who posted the listing and participates in concluding a deal on the property.',
    ].join('\n'),

    'offer.section3Title': '3. Subject of the service',
    'offer.section3Items': [
      'The App provides information about real estate properties and gives the User the ability to contact the Realtor.',
      'The App provides an information service. It is not a party to a sale, lease, or other transaction and does not act as an intermediary in a deal.',
      "All terms of a deal — price, payment procedure, timing for completing documents — are agreed directly between the User and the Realtor (or the property owner).",
      'The App does not guarantee that a deal will be concluded or that a property will be sold or leased.',
    ].join('\n'),

    'offer.section4Title': '4. Cost of the service',
    'offer.section4Items': [
      'For buyers and tenants, using the App — viewing, searching, saving listings, and contacting the Realtor — is completely free.',
      "Fees for the Realtor's services and any brokerage commission are not related to the App; they are determined by a separate agreement between the User and the Realtor.",
      'The Administration may introduce paid services for those who post listings in the future. Advance notice will be given in the App.',
    ].join('\n'),

    'offer.section5Title': '5. Rights and obligations of the User',
    'offer.section5Items': [
      'The User has the right to use the information in the App without restriction for personal, non-commercial purposes.',
      "Before concluding a deal, the User undertakes to independently verify the property's actual condition, the owner's rights, and the documents.",
      "Automated collection of the App's content (parsing/scraping), bulk copying, and redistribution for commercial purposes are prohibited.",
      "The User undertakes not to interfere with the App's operation, not to provide false information, and not to violate the rights of third parties.",
    ].join('\n'),

    'offer.section6Title': '6. Rights and obligations of the Administration',
    'offer.section6Items': [
      'Before publishing listings, the Administration reviews the documents and photos.',
      'Despite this review, the Administration does not guarantee the complete accuracy or currency of information obtained from third parties.',
      'The Administration has the right to remove a listing that violates the terms of the Offer or to restrict a User\'s access to the App.',
      "The App's operation may be temporarily suspended due to technical work or for reasons beyond the Administration's control.",
    ].join('\n'),

    'offer.section7Title': '7. Liability',
    'offer.section7Items': [
      "The Administration is not responsible for the accuracy of information provided by the listing owner, for the property's actual condition, or for the outcome of a deal.",
      'The Administration bears no liability for any damages arising from the relationship between the User and the Realtor.',
      'The price, area, floor, and other parameters shown in the App are provided for informational purposes. Final values and terms are determined at the time of the deal.',
      'The currency exchange rate and the price in soums shown in the App are for approximate calculation only and are not accepted as an official rate.',
    ].join('\n'),

    'offer.section8Title': '8. Personal data',
    'offer.section8Items': [
      'By using the App, the User consents to the processing of their data within the scope of this Offer.',
      'Data is processed and stored in accordance with the requirements of the Law of the Republic of Uzbekistan "On Personal Data".',
      "Saved (favorite) listings and search history are stored only on the User's device and are not sent to the server. They are also deleted when browser data is cleared.",
      "The Administration does not share the User's data with third parties for commercial purposes.",
    ].join('\n'),

    'offer.section9Title': '9. Dispute resolution',
    'offer.section9Items': [
      'Disputes between the parties are resolved primarily through negotiation.',
      'If no agreement is reached, the dispute is resolved in court in accordance with the legislation of the Republic of Uzbekistan.',
      'The substantive law of the Republic of Uzbekistan applies to the relationships under this Offer.',
    ].join('\n'),

    'offer.section10Title': '10. Final provisions',
    'offer.section10Items': [
      'The Offer is valid indefinitely from the moment it is published in the App.',
      'If any provision of the Offer is found to be invalid, this does not affect the validity of the remaining provisions.',
      'For questions regarding the Offer, you may reach out through the contacts on the "Contact" page.',
    ].join('\n'),

    notFoundTitle: 'This listing was not found',
    notFoundSubtitle: 'The link is outdated or the listing has been removed.',
    notFoundLinkLabel: 'All listings',
  },
};
