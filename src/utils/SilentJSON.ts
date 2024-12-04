namespace SilentJSON {
	export function parse<T>(text: string): T | undefined;
	export function parse<T>(text: string, defaultV: T): T;
	export function parse<T>(text: string, defaultV?: T): T | undefined {
		try {
			return <T>JSON.parse(text)
		} catch (e) {
			return defaultV;
		}
	}

}

export default SilentJSON;
