import App, { IInitialable } from "./App";
import Registry from "winreg";
import Settings from "./Database/Settings";
import { resolve } from "path";
import { readFile, writeFile } from "fs/promises";
import exsist from "@utils/exists";
import VDF from "valve-key-values";
import ObjectProxy from "../utils/ObjectProxy";
import { spawn } from "child_process";

interface SteamUserInfo extends VDF.VDFObject {
	timeused: string;
}

interface SteamConfig extends VDF.VDFObject {
	InstallConfigStore: {
		AuthorizedDevice: Record<string, SteamUserInfo>
	}
}

interface Manifest extends VDF.VDFObject {
	AppState: {
		appId: string;
		name: string;
		installdir: string;
	}
}

interface Library extends VDF.VDFObject {
	path: string;
	apps: Record<string, string>;
}
interface Libraries extends VDF.VDFObject {
	libraryfolders: Record<string, Library>;
}

class Steam implements IInitialable {
	private static readonly RegisterInstallKey = "InstallPath";
	private static readonly RegisterPIDKey = "SteamPID";
	private static readonly RegisterKey32 = new Registry({ hive: Registry.HKLM, key: '\\SOFTWARE\\Valve\\Steam' })
	private static readonly RegisterKey64 = new Registry({ hive: Registry.HKLM, key: '\\SOFTWARE\\Wow6432Node\\Valve\\Steam' })
	private static existKey(register: Registry.Registry, key: string) {
		return new Promise<boolean>(r => register.valueExists(key, (err, exists) => r(err ? false : exists)));
	}
	private static getKey(register: Registry.Registry, key: string) {
		return new Promise<string | null>(r => register.get(key, (err, item) => r(err ? null : item.value)));
	}
	private async getPathFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];
		for (const key of keys) {
			if (!await Steam.existKey(key, Steam.RegisterInstallKey)) continue;
			return await Steam.getKey(key, Steam.RegisterInstallKey);
		}
		return "";
	}
	private static setKey(register: Registry.Registry, key: string, value: string) {
		return new Promise<void>(r => register.get(key, (_, item) => {
			register.set(item.name, item.type, value, _ => r())
		}));
	}

	private static readonly SETTINGS_KEY = 'steamPath';

	private constructor() { }
	private _path: string = "";
	public get path() {
		return this._path;
	}

	private library: string = "";
	public async getLibraries() {
		const library_raw = await readFile(this.library, "utf-8");
		const libraries = (VDF.parse<Libraries>(library_raw)).libraryfolders;
		return libraries;
	}

	public async getAppManifest(libraryPath: string, appId: number) {
		if (!await exsist(libraryPath, 'dir')) return null;

		const path = resolve(libraryPath, `steamapps/appmanifest_${appId}.acf`)
		if (!await exsist(path)) return null;

		const manifest_raw = await readFile(path, "utf-8");
		const manifest = VDF.parse<Manifest>(manifest_raw);
		return manifest;
	}

	public async getLastUserId(): Promise<number | null> {
		const cfg_path = resolve(this.path, "config/config.vdf");
		if (!exsist(cfg_path)) return null;

		const raw_cfg = await readFile(cfg_path, "utf-8");
		const users = VDF.parse<SteamConfig>(raw_cfg).InstallConfigStore.AuthorizedDevice;

		let time: number = 0;
		let rawUserId: string = '';
		for (const userId in users) {
			const user = users[userId];
			const uTime = parseInt(user.timeused);
			if (uTime > time) {
				rawUserId = userId;
				time = uTime
			}
		}

		return parseInt(rawUserId);
	}

	private async getPIDFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];

		for (const key of keys) {
			if (!await Steam.existKey(key, Steam.RegisterPIDKey)) continue;

			let pid = await Steam.getKey(key, Steam.RegisterPIDKey);
			if (!pid) return 0;

			return parseInt(pid);
		}

		return 0;
	}

	private async resetPIDFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];

		for (const key of keys) {
			if (!await Steam.existKey(key, Steam.RegisterPIDKey)) continue;

			let pid = await Steam.getKey(key, Steam.RegisterPIDKey);
			if (pid == "0") return;
			return Steam.setKey(key, Steam.RegisterPIDKey, "0")
		}
	}

	public async getLaunchOptions(id: number): Promise<string | null> {
		if (!this.path) return null;
		const lastId = await this.getLastUserId();
		if (!lastId) return null;

		const cfg_path = resolve(
			this.path,
			"userdata",
			lastId.toString(),
			"config/localconfig.vdf"
		);
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy<LocalConfig>(VDF.parse<any>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps')
		const game_cfg = apps_dict.get(id.toString());
		if (!game_cfg) return null;

		return game_cfg.get('LaunchOptions')
	}
	public async setLaunchOptions(ids: number[]): Promise<number[]> {
		if (!this.path) return [];
		const lastId = await this.getLastUserId();
		if (!lastId) return [];

		const cfg_path = resolve(
			this.path,
			"userdata",
			lastId.toString(),
			"config/localconfig.vdf"
		);
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy(VDF.parse<LocalConfig>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps');
		const editIds: number[] = [];
		for (const id of ids) {
			const gameCfg = apps_dict.get(id.toString())
			if (!gameCfg) continue;
			gameCfg.set("LaunchOptions", this.getLaunchPath(id));
			editIds.push(id);
		}

		await writeFile(cfg_path, VDF.strigify(cfg.object))
		return editIds;
	}
	public async resetLaunchOptions(ids: number[]): Promise<number[]> {
		if (!this.path) return [];
		const lastId = await this.getLastUserId();
		if (!lastId) return [];

		const cfg_path = resolve(
			this.path,
			"userdata",
			lastId.toString(),
			"config/localconfig.vdf"
		);
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy(VDF.parse<LocalConfig>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps');
		const editIds: number[] = [];
		for (const id of ids) {
			const gameCfg = apps_dict.get(id.toString())
			if (!gameCfg) continue;
			gameCfg.set("LaunchOptions", "");
			editIds.push(id);
		}

		await writeFile(cfg_path, VDF.strigify(cfg.object))
		return editIds;
	}

	public getLaunchPath(id: number) {
		return [`"${App.getExecutable()}"`, `--launch=${id}`, "%command%"].join(' ')
	}

	public async init(message: (msg: string) => void): Promise<void> {
		message("Init stema");

		let path = await Settings.get(Steam.SETTINGS_KEY) || await this.getPathFromRegistry();

		if (!path || !await exsist(path, 'dir'))
			throw new Error("Steam not found");

		this._path = path;
		Settings.set(Steam.SETTINGS_KEY, this._path);

		const libraryPath = resolve(this._path, 'steamapps/libraryfolders.vdf');

		if (!exsist(libraryPath))
			throw new Error("Steam library not found");

		this.library = libraryPath;
	}

	public async stop() {
		const pid = await this.getPIDFromRegistry();
		if (pid == 0) return;

		const proc = spawn('powershell', ['-Command', `&{$process = Get-Process -Id ${pid};Stop-Process $process;$process.WaitForExit();$process.Close()}`]);
		await new Promise<void>(r => proc.on('close', () => r()))
		await this.resetPIDFromRegistry();

		console.log("PID:", await this.getPIDFromRegistry())
	}

	public async isRunning() {
		const pid = await this.getPIDFromRegistry();
		return pid != 0;
	}

	public async start() {
		const pid = await this.getPIDFromRegistry();
		if (pid !== 0) return;
		spawn(
			resolve(this.path, "steam.exe"),
			{ detached: true }
		)
	}


	private static _instance: Steam;
	public static get() {
		if (!this._instance) this._instance = new Steam();
		return this._instance;
	}
}

interface LocalConfig extends VDF.VDFObject {
	UserLocalConfigStore: {
		Software: {
			Valve: {
				Steam: {
					apps: {
						[id: string]: {
							LaunchOptions: string;
						}
					}
				}
			}
		}
	};
}

export default Steam;
