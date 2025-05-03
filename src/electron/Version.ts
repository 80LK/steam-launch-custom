class Version {
	private constructor() { }
	private static readonly REGEXP_VERSION = /(?:[a-z]){0,1}(\d+)\.(\d+)\.(\d+)(?:-(\d+))?/;
	private _major: number = 0;
	public get major() { return this._major };
	private _minor: number = 0;
	public get minor() { return this._minor };
	private _patch: number = 0;
	public get patch() { return this._patch };
	private _prerelease: number | null = null;
	public get prerelease() { return this._prerelease };

	public toString() {
		let str = `${this._major}.${this._minor}.${this._patch}`;
		if (this._prerelease != null) str += `-${this._prerelease}`;
		return str;
	}

	public compare(version: Version): Version.Compare {
		// Major
		if (this._major > version._major) return Version.Compare.GREAT;
		if (this._major < version._major) return Version.Compare.LESS;

		// Minor
		if (this._minor > version._minor) return Version.Compare.GREAT;
		if (this._minor < version._minor) return Version.Compare.LESS;

		// Patch
		if (this._patch > version._patch) return Version.Compare.GREAT;
		if (this._patch < version._patch) return Version.Compare.LESS;

		// Prerelease
		if (this._prerelease == null && version._prerelease != null) return Version.Compare.GREAT;
		if (this._prerelease != null && version._prerelease == null) return Version.Compare.LESS;
		if (this._prerelease == null && version._prerelease == null) return Version.Compare.EQUAL;


		if (this._prerelease! > version._prerelease!) return Version.Compare.GREAT;
		if (this._prerelease! < version._prerelease!) return Version.Compare.LESS;

		return Version.Compare.EQUAL;
	}


	public static createFromString(version: string) {
		const match = version.match(this.REGEXP_VERSION);
		if (!match)
			throw new ReferenceError('');

		const [_, major, minor, patch, prerelease] = match;
		return this.create(parseInt(major), parseInt(minor), parseInt(patch), prerelease ? parseInt(prerelease) : null);
	}

	public static create(major: number, minor: number, patch: number, prerelease: number | null = null) {
		const v = new Version();
		v._major = major;
		v._minor = minor;
		v._patch = patch;
		v._prerelease = prerelease;
		return v;
	}

	public static copy(version: Version) {
		return this.create(version._major, version._minor, version._patch, version._prerelease);
	}
}

namespace Version {
	export enum Compare {
		GREAT = 1,
		EQUAL = 0,
		LESS = -1
	}
}

export default Version;
