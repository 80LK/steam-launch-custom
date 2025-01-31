import parseBoolean from "@utils/parseBoolean";

const STORE_KEY = 'isDark';

async function isDark() {
	let val: string | boolean | null = localStorage.getItem(STORE_KEY);
	if (val !== null) val = parseBoolean(val);

	if (!val) {
		val = await Settings.getBoolean(STORE_KEY, false);
		localStorage.setItem(STORE_KEY, val.toString());
	}

	return val;
}

function setDark(value: boolean) {
	localStorage.setItem(STORE_KEY, value.toString());
	Settings.setBoolean(STORE_KEY, value);
}

export { isDark, setDark };
