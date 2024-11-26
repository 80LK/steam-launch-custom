import path from "path";
import { CONFIG_DIST } from "./consts";
import { existsSync, readFileSync, writeFileSync } from "fs";
import type IConfig from "../IConfig";

class Config implements IConfig {
	private static readonly CONFIG_PATH = path.join(CONFIG_DIST, "config");

	private constructor() { }

	private _steamPath: string = "";
	public get steamPath(): string {
		return this._steamPath;
	}
	public set steamPath(value: string) {
		if (!existsSync(value)) throw new ReferenceError(`Dir "${value}" not found`);
		this._steamPath = value;
	}
	public scanGameLaunch: boolean = false

	public save() {
		writeFileSync(Config.CONFIG_PATH, JSON.stringify(this));
	}

	public toJSON(): IConfig {
		return {
			steamPath: this._steamPath,
			scanGameLaunch: this.scanGameLaunch
		}
	}

	private static _instance: Config;
	public static getInstance(): Config {
		if (this._instance) return this._instance;

		const cfg = new Config();
		if (existsSync(Config.CONFIG_PATH)) {
			const raw = readFileSync(Config.CONFIG_PATH, "utf-8");
			try {
				const obj: IConfig = JSON.parse(raw);
				if (obj.steamPath) cfg._steamPath = obj.steamPath;
				if (obj.scanGameLaunch) cfg.scanGameLaunch = obj.scanGameLaunch;
			} catch (e) { }
		}
		this._instance = cfg;

		return this._instance;
	}
}

export default Config;
