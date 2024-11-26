import { EventEmitter } from "events";
import InitState, { INIT_MESSAGE } from "../SteamInitState";
import Registry from "winreg";
import Config from "./Config";
import sleep from "../utils/sleep";

interface SteamEventMap {
	changeInitState: [InitState, string]
}

const config = Config.getInstance();

class Steam extends EventEmitter<SteamEventMap> {
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


	private constructor() {
		super();
	}

	private _state: InitState = InitState.INIT;
	private _stateMessage: string = INIT_MESSAGE;

	private setState(state: InitState, message: string) {
		this.emit('changeInitState', state, message);
		this._state = state;
		this._stateMessage = message;
	}

	private init() {
		this.findSteam();
		return this;
	}

	private async findSteam() {
		this.setState(InitState.FIND_STEAM, 'Find Steam');
		if (config.steamPath) {
			if (config.scanGameLaunch)
				return this.scanGames();
		} else {
			let path = await Steam.getPathFromRegistry();
			if (!path) return this.setState(InitState.CANT_FIND_STEAM, "Can't find Steam");
			config.steamPath = path;
			config.save();
			return this.scanGames();
		}

		this.ready();
	}

	public async scanGames() {
		this.setState(InitState.FIND_GAMES, 'Find games');
		await sleep(5000);
		this.ready();
	}

	private ready() {
		this.setState(InitState.READY, 'Ready');
	}

	public getState() {
		return {
			state: this._state,
			message: this._stateMessage
		}
	}

	private static _instance: Steam;
	public static getInstance() {
		if (!this._instance)
			this._instance = new Steam().init();
		return this._instance;
	}
}

export default Steam;
