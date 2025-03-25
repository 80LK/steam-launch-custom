import parseBoolean from "@utils/parseBoolean";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { SCAN_GAME_IN_LAUNCH_KEY } from '@shared/Game';
import { ref } from "vue";

const STORE_KEY = 'theme';
const OLD_STORE_KEY = 'isDark';

const useSettings = defineStore('settings', () => {
	const theme = useTheme();
	const { t } = useI18n();

	function init() {
		let val: string | null = localStorage.getItem(STORE_KEY);
		if (val == null) {
			val = localStorage.getItem(OLD_STORE_KEY);
			if (val != null) val = parseBoolean(val) ? 'dark' : 'light';
		}

		setTheme(val || 'light');
	}
	init();

	function setTheme(nameTheme: string) {
		console.log('Try set theme ', nameTheme)
		theme.global.name.value = nameTheme;
		localStorage.setItem(STORE_KEY, nameTheme);
		Settings.set(STORE_KEY, nameTheme);
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

	const scanGameLaunch = ref(false);
	Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false).then(v => scanGameLaunch.value = v);
	const appDataPath = ref('');
	const steamPath = ref('');
	App.getAppData().then(value => appDataPath.value = value);
	Steam.getPath().then(value => steamPath.value = value);

	return {
		theme: {
			available: Object.keys(theme.themes.value).map(theme => ({ value: theme, title: t(`theme.${theme}`, theme) })),
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
		steamPath
	}
})

export default useSettings;
