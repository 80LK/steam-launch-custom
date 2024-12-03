import IConfig from "../../IConfig";
import Database from "../Database";
import { existsSync } from "fs";

interface SettingRow {
	name: string;
	value: string;
}

class Config extends Database.Model implements IConfig {
	public static name: string = "Config";
	private _steamPath: string = "";
	public get steamPath(): string {
		return this._steamPath;
	}
	public set steamPath(value: string) {
		if (!existsSync(value)) throw new ReferenceError(`Dir "${value}" not found`);
		this._steamPath = value;
	}
	public scanGameLaunch: boolean = false;
	public dark: boolean = false;

	public async save() {
		const querty = Database.Model.prepare(`INSERT OR REPLACE INTO ${Config.DB_NAME} (name, value) values ($key, $value);`);
		await Promise.all([
			querty.run({ key: 'steamPath', value: this._steamPath }),
			querty.run({ key: 'scanGameLaunch', value: (this.scanGameLaunch ? 1 : 0).toString() }),
			querty.run({ key: 'dark', value: (this.dark ? 1 : 0).toString() })
		]);
	}

	public toJSON(): IConfig {
		return {
			steamPath: this.steamPath,
			scanGameLaunch: this.scanGameLaunch,
			dark: this.dark
		}
	}

	private constructor() { super() }
	private static _instance: Config;
	public static getInstance(): Config {
		if (!this._instance) this._instance = new this();
		return this._instance;
	}

	private static readonly DB_NAME = "setting";

	public static async init() {
		const table_exist = await this.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=$table_name LIMIT 1;", { table_name: this.DB_NAME });
		if (!table_exist) {
			await this.run(`CREATE TABLE ${this.DB_NAME} (
			name varchar(32) PRIMARY KEY,
			value varchar(255)
		);`);
			await this.run(`INSERT INTO ${this.DB_NAME} VALUES($key, $value)`, { key: "db_version", value: "1" })
			return;
		}

		const cfg = this.getInstance();
		const state = this.prepare<SettingRow>(`SELECT name, value FROM ${this.DB_NAME} WHERE name = $key`);
		const steamPath = (await state.get({ key: 'steamPath' }))?.value;
		if (steamPath) cfg._steamPath = steamPath;

		const scanGameLaunch = (await state.get({ key: 'scanGameLaunch' }))?.value;
		if (scanGameLaunch) cfg.scanGameLaunch = scanGameLaunch == "1";

		const dark = (await state.get({ key: 'dark' }))?.value;
		if (dark) cfg.dark = dark == "1";
	}
}

export default Config;
