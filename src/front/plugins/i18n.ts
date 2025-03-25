import { createI18n } from "vue-i18n"
import { en as vuetify_en, ru as vuetify_ru } from 'vuetify/locale'

import en from "@locales/en.json";
import ru from "@locales/ru.json";

const i18n = createI18n({
	legacy: false,
	locale: 'ru',
	fallbackLocale: 'en',
	messages: {
		en: { $vuetify: vuetify_en, ...en },
		ru: { $vuetify: vuetify_ru, ...ru },
	}
});

export default i18n;
