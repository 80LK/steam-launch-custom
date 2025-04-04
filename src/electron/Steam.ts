import App, { IInitialable } from "./App";
import Registry from "winreg";
import { resolve } from "path";
import { readFile, writeFile } from "fs/promises";
import exsist from "@utils/exists";
import VDF from "valve-key-values";
import ObjectProxy from "../utils/ObjectProxy";
import { spawn } from "child_process";
import { app } from "electron";
import BaseWindow from "./Window/BaseWindow";
import { IPCTunnel } from "./IPCTunnel";
import { Messages } from "@shared/Steam";
import Logger from "./Logger";

interface AuthorizedDevice extends VDF.VDFObject {
	timeused: string;
}

interface SteamConfig extends VDF.VDFObject {
	InstallConfigStore: {
		AuthorizedDevice: Record<string, AuthorizedDevice>
	}
}

interface SteamUserInfo extends VDF.VDFObject {
	Timestamp: string;
}
interface LoginUsers extends VDF.VDFObject {
	users: Record<string, SteamUserInfo>
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

enum TestLaunch {
	NO = 'no',
	CURRENT = 'current',
	NOT_CURRENT = 'not current'
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

	// @ts-ignore Old method
	private async _getLastUserId(): Promise<number | null> {
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

		Logger.log(`Last User ID: ${rawUserId}`, { prefix: "Steam" });
		return parseInt(rawUserId);
	}
	private lastUserId: number | null = null;
	public async getLastUserId(): Promise<number | null> {
		if (this.lastUserId) return this.lastUserId;

		const cfg_path = resolve(this.path, "config/loginusers.vdf");
		if (!exsist(cfg_path)) return null;

		const raw_cfg = await readFile(cfg_path, "utf-8");
		const users = new ObjectProxy<LoginUsers>(VDF.parse<any>(raw_cfg)).get("users");

		let time: number = 0;
		let rawUserId64: string = '';
		for (const userId64 in users.object) {
			const user = users.get(userId64);
			const uTime = parseInt(user.get('Timestamp'));
			if (uTime > time) {
				rawUserId64 = userId64;
				time = uTime
			}
		}
		const userId = Steam.convertSteam64IDtoAccountID(rawUserId64);
		Logger.log(`Last User ID: ${rawUserId64} | ${userId}`, { prefix: "Steam" });
		this.lastUserId = userId;
		return userId;
	}

	private localConfigPath: string | null = null;
	public async getLocalConfigPath(): Promise<string | null> {
		if (this.localConfigPath) return this.localConfigPath;

		if (!this.path) return null;
		const lastId = await this.getLastUserId();
		if (!lastId) return null;

		const cfg_path = resolve(
			this.path,
			"userdata",
			lastId.toString(),
			"config/localconfig.vdf"
		);

		Logger.log(`Steam local config path: ${cfg_path}`, { prefix: 'Steam' });
		this.localConfigPath = cfg_path;
		return cfg_path;
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
		const cfg_path = await this.getLocalConfigPath();
		if (!cfg_path) return null;
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy<LocalConfig>(VDF.parse<any>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps')
		const game_cfg = apps_dict.get(id.toString());
		if (!game_cfg) return null;

		return game_cfg.get('LaunchOptions')
	}
	public async setLaunchOptions(ids: number[]): Promise<number[]> {
		const cfg_path = await this.getLocalConfigPath();
		if (!cfg_path) return [];
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy(VDF.parse<LocalConfig>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps');
		const editIds: number[] = [];
		for (const id of ids) {
			const gameCfg = apps_dict.get(id.toString())
			Logger.log(`Game cfg is ${gameCfg ? '' : 'not '}found`, { prefix: `Steam][Game ${id}` })
			if (!gameCfg) continue;
			Logger.log(`Write launchOptions ${this.getLaunchPath(id)}`, { prefix: `Steam][Game ${id}` })
			gameCfg.set("LaunchOptions", this.getLaunchPath(id));
			editIds.push(id);
		}

		await writeFile(cfg_path, VDF.strigify(cfg.object))
		Logger.log(`write games ${JSON.stringify(editIds)}`, { prefix: `Steam` })
		return editIds;
	}
	public async resetLaunchOptions(ids: number[]): Promise<number[]> {
		const cfg_path = await this.getLocalConfigPath();
		if (!cfg_path) return [];
		const cfg_raw = await readFile(cfg_path, "utf-8");
		const cfg = new ObjectProxy(VDF.parse<LocalConfig>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps');
		const editIds: number[] = [];
		for (const id of ids) {
			const gameCfg = apps_dict.get(id.toString())
			Logger.log(`Game cfg is ${gameCfg ? '' : 'not '}found`, { prefix: `Steam][Game ${id}` })
			if (!gameCfg) continue;
			gameCfg.set("LaunchOptions", "");
			editIds.push(id);
		}

		await writeFile(cfg_path, VDF.strigify(cfg.object))
		Logger.log(`reset games ${JSON.stringify(editIds)}`, { prefix: `Steam` })
		return editIds;
	}

	public async testLaunchPath(id: number): Promise<TestLaunch> {
		const path = await this.getLaunchOptions(id);
		Logger.log(`Current path: ${path}`, { prefix: 'Steam] [Game ' + id })
		if (!path) return TestLaunch.NO;
		// /".*\/electron.exe" ".*" --launch=\d+ %command%/

		if (!/\\".*\/(?:steam-launch-custom.exe|electron.exe\\" \\".*)\\" --launch=\d+ %command%/.test(path))
			return TestLaunch.NO;

		Logger.log(`Need set path: ${this.getLaunchPath(id)}`, { prefix: 'Steam] [Game ' + id })
		return path == this.getLaunchPath(id) ? TestLaunch.CURRENT : TestLaunch.NOT_CURRENT;
	}
	public getLaunchPath(id: number) {
		const args = [`\\"${App.getExecutable()}\\"`];
		if (!app.isPackaged) args.push(`\\"${process.argv[1].replace(/\\/g, "/")}\\"`);
		args.push(`--launch=${id}`, "%command%")
		return args.join(' ')
	}

	public async init(message: (msg: string) => void): Promise<void> {
		message("init.steam");

		let path = await this.getPathFromRegistry();

		if (!path || !await exsist(path, 'dir'))
			throw new Error("error.steam_not_found");

		this._path = path;

		const libraryPath = resolve(this._path, 'steamapps/libraryfolders.vdf');

		if (!exsist(libraryPath))
			throw new Error("error.steam_library_not_found");

		this.library = libraryPath;
	}

	public async stop() {
		const pid = await this.getPIDFromRegistry();
		if (pid == 0) return;

		const proc = spawn('powershell', ['-Command', `&{$process = Get-Process -Id ${pid};Stop-Process $process;$process.WaitForExit();$process.Close()}`]);
		await new Promise<void>(r => proc.on('close', () => r()))
		await this.resetPIDFromRegistry();
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

	public static IPC(_: BaseWindow, ipc: IPCTunnel) {
		ipc.handle(Messages.getPath, () => Steam.get().path);
	}

	// https://developer.valvesoftware.com/wiki/SteamID
	private static convertSteam64IDtoAccountID(id: bigint | string): number {
		if (typeof id == "string") id = BigInt(id);
		return Number(id - 0x0110000100000000n);
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
export { TestLaunch }
