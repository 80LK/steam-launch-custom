namespace SilentJSON {
	export function parse<T, D extends T | undefined = undefined>(text: string, defaultV: D): D | T {
		try {
			return <T>JSON.parse(text)
		} catch (e) {
			return defaultV;
		}
	}

}

export default SilentJSON;
