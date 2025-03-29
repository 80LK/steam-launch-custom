import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n';
import i18n from './i18n';
import themes from '../themes';

const vuetify = createVuetify({
	theme: {
		defaultTheme: 'light',
		themes
	},
	icons: {
		defaultSet: 'mdi',
		aliases,
		sets: { mdi },
	},
	defaults: {
		VTextField: { variant: 'outlined', density: "compact" },
		VSelect: { variant: 'outlined', density: "compact" },
		VCombobox: { variant: 'outlined', density: "compact" },
	},
	locale: {
		adapter: createVueI18nAdapter({ useI18n, i18n })
	},
});

export default vuetify;
