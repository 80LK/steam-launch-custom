import Service, { ServiceState } from "../Service";
import Config from "../Config/Config";
import Registry from "winreg";
import path from "path";
import VDF from "@node-steam/vdf";
import { existsSync, readFileSync } from "fs";
import Game from "../Game/Game";

interface SteamUserInfo {
	timeused: number;
	description: string;
	tokenid: number;
}

interface Library {
	path: string;
	apps: Record<string, string>;
}
interface Libraries {
	libraryfolders: Record<string, Library>;
}

interface Manifest {
	AppState: {
		appId: number;
		name: string;
		installdir: string;
	}
}

const config = Config.getInstance();

class Steam extends Service {
	private static readonly RegisterInstallKey = "InstallPath";
	private static readonly RegisterKey32 = new Registry({ hive: Registry.HKLM, key: '\\SOFTWARE\\Valve\\Steam' })
	private static readonly RegisterKey64 = new Registry({ hive: Registry.HKLM, key: '\\SOFTWARE\\Wow6432Node\\Valve\\Steam' })
	private static async getPathFromRegistry() {
		const keys = process.arch == "x64" ? [Steam.RegisterKey64, Steam.RegisterKey32] : [Steam.RegisterKey32, Steam.RegisterKey64];
		let path = ""
		for (const key of keys) {
			path = await new Promise<string>((r) => {
				key.values((err, items) => {
					if (err) return r("");
					const value = items.find(e => e.name == Steam.RegisterInstallKey);
					if (!value) return r('');
					r(value.value)
				})
			});
			if (path != "") break;
		}
		return path;
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
		const libraries = (<Libraries>VDF.parse(library_raw)).libraryfolders;


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
		const users = VDF.parse(raw_config).InstallConfigStore.AuthorizedDevice as Record<string, SteamUserInfo>;

		let time = 0;
		let rawUserId = '';
		for (const userId in users) {
			const user = users[userId];
			if (user.timeused > time) rawUserId = userId;
		}

		return parseInt(rawUserId);
	}
}

export default Steam;
