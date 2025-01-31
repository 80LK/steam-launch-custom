import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { isDark } from '@store/isDark';


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
});

export default vuetify;
