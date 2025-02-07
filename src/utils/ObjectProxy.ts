class ObjectProxy<T extends NodeJS.Dict<any>> {
	constructor(public readonly object: T) { }

	public get<K extends keyof T>(key: K): T[K] extends object ? ObjectProxy<T[K]> : T[K];
	public get(key: string): any;
	public get(key: string) {
		const founded_key: keyof T | undefined = Object.keys(this.object).find(e => e.toLowerCase() == key.toLowerCase());
		if (!founded_key) return null;

		const value = this.object[founded_key];

		if (typeof value == "object") {
			return new ObjectProxy(value);
		}

		return value;
	}

	public set<K extends keyof T & string>(key: K, value: T[K]) {
		const founded_key: K = <any>Object.keys(this.object).find(e => e.toLowerCase() == key.toLowerCase()) || key;
		this.object[founded_key] = value;
	}
}
export default ObjectProxy;
