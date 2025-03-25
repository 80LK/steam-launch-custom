import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { isDark } from '@store/isDark';
import { useI18n } from 'vue-i18n';
import i18n from './i18n';


const vuetify = createVuetify({
	theme: {
		defaultTheme: await isDark() ? 'dark' : 'light'
	},
	icons: {
		defaultSet: 'mdi',
		aliases,
		sets: {
			mdi
		},
	},
	locale: {
		adapter: createVueI18nAdapter({ useI18n, i18n })
	}
});

export default vuetify;
