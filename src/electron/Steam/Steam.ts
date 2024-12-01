import Service, { ServiceState } from "../Service";
import Config from "../Config/Config";
import Registry from "winreg";
import path from "path";
import VDF from "valve-key-values";
import { existsSync, readFileSync } from "fs";
import Game from "../Game/Game";
import { spawn } from "child_process";

interface SteamUserInfo extends VDF.VDFObject {
	timeused: string;
}

interface SteamConfig extends VDF.VDFObject {
	InstallConfigStore: {
		AuthorizedDevice: Record<string, SteamUserInfo>
	}
}
interface Library extends VDF.VDFObject {
	path: string;
	apps: Record<string, string>;
}
interface Libraries extends VDF.VDFObject {
	libraryfolders: Record<string, Library>;
}

interface Manifest extends VDF.VDFObject {
	AppState: {
		appId: string;
		name: string;
		installdir: string;
	}
}

const config = Config.getInstance();

class Steam extends Service {
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

	private static setKey(register: Registry.Registry, key: string, value: string) {
		return new Promise<void>(r => register.get(key, (_, item) => {
			register.set(item.name, item.type, value, _ => r())
		}));
	}

	private static async getPathFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];
		for (const key of keys) {
			if (!await this.existKey(key, Steam.RegisterInstallKey)) continue;
			return await this.getKey(key, Steam.RegisterInstallKey);
		}
		return "";
	}



	private static async getPIDFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];

		for (const key of keys) {
			if (!await this.existKey(key, Steam.RegisterPIDKey)) continue;

			let pid = await this.getKey(key, Steam.RegisterPIDKey);
			if (!pid) return 0;

			return parseInt(pid);
		}

		return 0;
	}
	private static async resetPIDFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];

		for (const key of keys) {
			if (!await this.existKey(key, Steam.RegisterPIDKey)) continue;

			let pid = await this.getKey(key, Steam.RegisterPIDKey);
			if (pid == "0") return;
			return this.setKey(key, Steam.RegisterPIDKey, "0")
		}
	}

	constructor() {
		super("Steam")
	}
	protected async _init() {
		this.setState("Searching steam");
		if (config.steamPath) {
			if (config.scanGameLaunch)
				await this.scanGames();
		} else {
			let path = await Steam.getPathFromRegistry();
			if (!path) return <void><unknown>this.setState(ServiceState.FAIL, "Can't find Steam");
			config.steamPath = path;
			config.save();
			await this.scanGames();
		}
	}

	public async scanGames() {
		this.setState('Searching games');

		const library_path = path.join(`${config.steamPath}/steamapps/libraryfolders.vdf`);
		if (!existsSync(library_path)) return this.setState(ServiceState.FAIL, "Not found Library file");

		const library_raw = readFileSync(library_path, "utf-8");
		const libraries = (VDF.parse<Libraries>(library_raw)).libraryfolders;


		for (const key in libraries) {
			const library = libraries[key];
			for (const s_appId in library.apps) {
				const i_appId = parseInt(s_appId);
				const manifest_path = path.join(library.path, `steamapps/appmanifest_${s_appId}.acf`);
				if (!existsSync(manifest_path)) continue;
				const manifest_raw = readFileSync(manifest_path, "utf-8");
				const manifest = (<Manifest>VDF.parse(manifest_raw)).AppState;

				const installdir = path.join(library.path, "steamapps/common", manifest.installdir);
				if (!existsSync(installdir)) continue;
				if (!await Game.find(i_appId))
					await Game.create(i_appId, manifest.name, installdir).save()
			}
		}
	}

	private static _instance: Steam;
	public static getInstance() {
		if (!this._instance) this._instance = new Steam();
		return this._instance;
	}

	public static getLastUserId(): number {
		const config_path = path.join(
			config.steamPath,
			"config/config.vdf"
		);
		const raw_config = readFileSync(config_path, "utf-8");
		const users = VDF.parse<SteamConfig>(raw_config).InstallConfigStore.AuthorizedDevice;

		let time = 0;
		let rawUserId = '';
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

	public static async stop() {
		const pid = await this.getPIDFromRegistry();
		if (pid == 0) return;
		const proc = spawn('powershell', ['-Command', `&{$process = Get-Process -Id ${pid};Stop-Process $process;$process.WaitForExit();$process.Close()}`]);
		await new Promise<void>(r => proc.on('close', () => r()))
		await this.resetPIDFromRegistry();
	}

	public static async start() {
		const pid = await this.getPIDFromRegistry();
		if (pid !== 0) return;
		spawn(
			path.join(config.steamPath, "steam.exe"),
			{ detached: true }
		)
	}
}

export default Steam;
