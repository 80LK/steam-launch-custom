import parseBoolean from "@utils/parseBoolean";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { SCAN_GAME_IN_LAUNCH_KEY } from '@shared/Game';
import { ref, watch } from "vue";

const THEME_OLD_STORE_KEY = 'isDark';
const LOCALE_OLD_STORE_KEY = 'en';

const THEME_STORE_KEY = 'theme';
const LOCALE_STORE_KEY = 'lang';

const useSettings = defineStore('settings', () => {
	const theme = useTheme();
	const { t, locale, messages } = useI18n();
	const availableThemes = ref(Object.keys(theme.themes.value).map(theme => ({
		value: theme, title: t(`theme.${theme}`, theme)
	})));
	watch(locale, () => {
		console.log('switch locale');
		availableThemes.value.forEach(item => item.title = t(`theme.${item.value}`, item.value))
	});

	const scanGameLaunch = ref(false);
	const appDataPath = ref('');
	const steamPath = ref('');

	function init() {
		let theme: string | null = localStorage.getItem(THEME_STORE_KEY);
		if (theme == null) {
			theme = localStorage.getItem(THEME_OLD_STORE_KEY);
			if (theme != null) theme = parseBoolean(theme) ? 'dark' : 'light';
		}
		setTheme(theme || 'light');

		let locale: string | null = localStorage.getItem(LOCALE_STORE_KEY);
		if (locale == null) {
			locale = localStorage.getItem(LOCALE_OLD_STORE_KEY);
		if (locale == null) locale = 'en';
		}
		setLocale(locale);

		Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false).then(v => scanGameLaunch.value = v);
		App.getAppData().then(value => appDataPath.value = value);
		Steam.getPath().then(value => steamPath.value = value);
	}
	init();

	function setTheme(nameTheme: string) {
		if (theme.global.name.value != nameTheme)
		theme.global.name.value = nameTheme;
		localStorage.setItem(THEME_STORE_KEY, nameTheme);
		Settings.set(THEME_STORE_KEY, nameTheme);
	}

	function setLocale(codeLocale: string) {
		if (locale.value != codeLocale)
		locale.value = codeLocale;
		localStorage.setItem(LOCALE_STORE_KEY, codeLocale);
		Settings.set(LOCALE_STORE_KEY, codeLocale);
	}


	function edit(field: string, value: any) {
		switch (typeof value) {
			case "boolean":
				Settings.setBoolean(field, value);
				break;

			case "number":
				Settings.setNumber(field, value);
				break;

			case "string":
				Settings.set(field, value);
				break;

			default:
				Settings.set(field, value.toString());
				break;
		}
	}

	return {
		theme: {
			available: availableThemes,
			current: theme.global.name,
			set: setTheme
		},
		scanGameLaunch: {
			value: scanGameLaunch,
			set: (value: boolean | null) => {
				scanGameLaunch.value = value || false;
				edit(SCAN_GAME_IN_LAUNCH_KEY, scanGameLaunch.value)
			}
		},
		appDataPath,
		steamPath,
		locale: {
			current: locale,
			available: Object.keys(messages.value).map(code => ({ value: code, title: messages.value[code]['$lang'] || code })),
			set: setLocale
		}
	}
})

export default useSettings;
