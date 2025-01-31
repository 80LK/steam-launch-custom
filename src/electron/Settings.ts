import BaseWindow from "./BaseWindow";
import Database from "./Database";
import { IPCTunnel } from "./IPCTunnel";
import parseBoolean from "@utils/parseBoolean";
import Messages from "./SettingsMessages";

class Settings extends Database.Model {
	private static readonly DB_NAME = "setting";
	public static async init() {
		const exsist = await this.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name = $name LIMIT 1;").get({ name: this.DB_NAME });
		if (exsist) return;

		await this.prepare(`CREATE TABLE ${this.DB_NAME} (
			name varchar(32) PRIMARY KEY,
			value varchar(255)
		);`).run();
	}

	//String
	public static async get(name: string, defaultValue?: string): Promise<string | null> {
		const result = await this.prepare<{ value: string }>(`SELECT value FROM ${this.DB_NAME} WHERE name = $name LIMIT 1;`).get({ name });
		if (!result) return defaultValue ?? null;
		return result.value;
	};
	public static set(name: string, value: string) {
		return this.prepare(`INSERT OR REPLACE INTO ${this.DB_NAME} (name, value) values ($name, $value);`).run({ name, value });
	};

	//Number
	public static async getNumber(name: string, defaultValue?: number): Promise<number | null> {
		const value = await this.get(name);
		if (!value) return defaultValue ?? null;
		const result = parseFloat(value)
		return isNaN(result) ? (defaultValue ?? null) : result;
	};
	public static setNumber(name: string, value: number) {
		return this.set(name, value.toString());
	};

	//Boolean
	public static async getBoolean(name: string, defaultValue?: boolean): Promise<boolean | null> {
		const value = await this.get(name);
		if (!value) return defaultValue ?? null;

		return parseBoolean(value) ?? defaultValue ?? null;
	};
	public static setBoolean(name: string, value: boolean) {
		return this.set(name, value.toString());
	};

	public static IPC(_: BaseWindow, ipc: IPCTunnel) {
		ipc.handle(Messages.get, (name: string) => Settings.get(name));
		ipc.on(Messages.set, (name: string, value: string) => Settings.set(name, value));

		ipc.handle(Messages.getNumber, (name: string) => Settings.getNumber(name));
		ipc.on(Messages.setNumber, (name: string, value: number) => Settings.setNumber(name, value));


		ipc.handle(Messages.getBoolean, (name: string) => Settings.getBoolean(name));
		ipc.on(Messages.setBoolean, (name: string, value: boolean) => Settings.setBoolean(name, value));
	}
}



export default Settings;
