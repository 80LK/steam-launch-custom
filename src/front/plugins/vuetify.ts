import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n';
import i18n from './i18n';
const steamTheme = {
	dark: true,
	colors: {
		background: '#2C323B',
		surface: '#171D25',
		'surface-light': '#171D25',
		'on-surface-variant': "#fff",

		'surface-bright': '#FFFFFF',
		'surface-variant': '#171D25',

		primary: '#2DA1D6',
	},
	variables: {
		'button-border-radius': 0,
		'card-border-radius': 0,
		'input-variant': 'solo',
		'switch-inset': 'true'
	}
}

const vuetify = createVuetify({
	theme: {
		defaultTheme: 'light',
		themes: {
			steam: steamTheme,
			light: { colors: { primary: '#4caf50' } },
			dark: { colors: { primary: '#4caf50' } }
		}
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
