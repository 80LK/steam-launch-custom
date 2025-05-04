import parseBoolean from "@utils/parseBoolean";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { SCAN_GAME_IN_LAUNCH_KEY } from '@shared/Game';
import { ref, watch } from "vue";
import { USE_APPINFO } from "@shared/Configure";
import { CHECK_PRERELEASE_KEY } from "@shared/Updater";

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
		availableThemes.value.forEach(item => item.title = t(`theme.${item.value}`, item.value))
	});

	const scanGameLaunch = ref(false);
	const useAppInfo = ref(false);
	const checkPreRelease = ref(false);

	function init() {
		let cachedTheme: string | null = localStorage.getItem(THEME_STORE_KEY);
		if (cachedTheme == null) {
			cachedTheme = localStorage.getItem(THEME_OLD_STORE_KEY);
			if (cachedTheme != null) cachedTheme = parseBoolean(cachedTheme) ? 'dark' : 'light';
		}
		theme.global.name.value = cachedTheme || 'light';

		let cachedLocale: string | null = localStorage.getItem(LOCALE_STORE_KEY);
		if (cachedLocale == null) {
			cachedLocale = localStorage.getItem(LOCALE_OLD_STORE_KEY);
		}
		locale.value = cachedLocale || 'en';

		Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false).then(v => scanGameLaunch.value = v);
		Settings.getBoolean(USE_APPINFO, false).then(v => useAppInfo.value = v);
		Settings.getBoolean(CHECK_PRERELEASE_KEY, false).then(v => checkPreRelease.value = v);
		Settings.get(THEME_STORE_KEY, 'light').then(value => setTheme(value));
		Settings.get(LOCALE_STORE_KEY, 'en').then(value => setLocale(value));
	}

	function setTheme(nameTheme: string) {
		Logger.log(`setTheme: ${nameTheme}`);
		if (theme.global.name.value == nameTheme) return;
		theme.global.name.value = nameTheme;
		localStorage.setItem(THEME_STORE_KEY, nameTheme);
		Settings.set(THEME_STORE_KEY, nameTheme);
	}

	function setLocale(codeLocale: string) {
		Logger.log(`setLocale: ${codeLocale}`);
		if (locale.value == codeLocale) return;
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
		init,
		theme: {
			available: availableThemes,
			current: theme.global.name,
			set: setTheme
		},
		useAppInfo: {
			value: useAppInfo,
			set(value: boolean | null) {
				useAppInfo.value = value || false;
				edit(USE_APPINFO, useAppInfo.value)
			}
		},
		scanGameLaunch: {
			value: scanGameLaunch,
			set: (value: boolean | null) => {
				scanGameLaunch.value = value || false;
				edit(SCAN_GAME_IN_LAUNCH_KEY, scanGameLaunch.value)
			}
		},
		checkPreRelease: {
			value: checkPreRelease,
			set: (value: boolean | null) => {
				checkPreRelease.value = value || false;
				edit(CHECK_PRERELEASE_KEY, checkPreRelease.value)
			}
		},
		locale: {
			current: locale,
			available: Object.keys(messages.value).map(code => ({ value: code, title: messages.value[code]['$lang'] || code })),
			set: setLocale
		}
	}
})

export default useSettings;
