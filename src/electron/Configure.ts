import Settings from "./Database/Settings";
import { IPCTunnel } from "./IPCTunnel";
import { ChangeStateListener, Messages, USE_APPINFO } from "@shared/Configure";
import Logger from "./Logger";
import parseBoolean from "@utils/parseBoolean";
import VKVB, { AppInfo, Map, MapWithHeader } from "valve-key-values-binary";
import Steam from "./Steam";
import { copyFile, readFile, writeFile } from "fs/promises";
import Game from "./Database/Game";
import Launch from "./Database/Launch";
import { dirname, relative, resolve } from "path";
import exsist from "@utils/exists";
import { ASAR_ROOT, DEV } from "./consts";

namespace Configure {
	const steam = Steam.get();

	let canUseAppInfo = true;
	let appinfo: MapWithHeader<AppInfo> | null = null;
	async function readAppInfo() {
		try {
			const buffer = await readFile(steam.pathToAppInfo);
			const map = VKVB.parse(buffer);
			if (!VKVB.isAppInfo(map))
				throw new Error('Is not AppInfo');

			appinfo = map;
		} catch (e) {
			Logger.error("Can't read AppInfo");
			await Settings.setBoolean(USE_APPINFO, canUseAppInfo = false);
		}
	}

	let storeGames = {} as Record<number, Game>;
	async function readGames() {
		storeGames = {};
		const games = await Game.needWrite();
		games.forEach(game => { storeGames[game.id] = game });
	}
	export function editGame(game: Game) {
		if (game.needWrite)
			storeGames[game.id] = game;
		else
			delete storeGames[game.id];
		changeState();
	}


	type VDFBLaunch = AppInfo[string]['appinfo']['config']['launch'][number] & { 'slc_id': number };
	type VDFBLaunchs = VDFBLaunch[];

	async function compareLaunchs(db_launch: Launch, ai_launch: VDFBLaunch, game: Game): Promise<boolean> {
		const { execute, workdir, args } = await getLuanchOptions(game, db_launch);

		if (ai_launch.description != db_launch.name) return false;
		if (ai_launch.executable != execute) return false;
		if (ai_launch.workingdir != workdir) return false;
		if (args != ai_launch.arguments) return false;

		return true;
	}
	let storeLaunchsFromAppInfo = {} as Record<number, Map<VDFBLaunchs>>;
	function getLaunchsFromAppInfo(gameId: number) {
		if (appinfo == null) return null;
		if (storeLaunchsFromAppInfo[gameId]) return storeLaunchsFromAppInfo[gameId];

		storeLaunchsFromAppInfo[gameId] = appinfo.getMap(gameId)?.getMap('appinfo')?.getMap('config')?.getMap('launch')! as unknown as Map<VDFBLaunchs>;
		return storeLaunchsFromAppInfo[gameId];
	}
	let storeLaunchFromAppInfo = {} as Record<number, Record<number, Map<VDFBLaunch>>>;
	function getLaunch(gameId: number, launch_id: number) {
		if (!storeLaunchFromAppInfo[gameId]) {
			storeLaunchFromAppInfo[gameId] = {};
			return null;
		}

		if (storeLaunchFromAppInfo[gameId][launch_id]) return storeLaunchFromAppInfo[gameId][launch_id];
		const launchs = getLaunchsFromAppInfo(gameId);
		if (!launchs) return null;
		for (const key of launchs.getKeys()) {
			const launch = launchs.getMap(key)!;
			if (launch.getInt('slc_id') == launch_id) {
				storeLaunchFromAppInfo[gameId][launch_id] = launch;
				return storeLaunchFromAppInfo[gameId][launch_id];
			}
		}
		return null;
	}
	function setLaunch(gameId: number, launch_id: number, launch: Map<VDFBLaunch>) {
		if (!storeLaunchFromAppInfo[gameId])
			storeLaunchFromAppInfo[gameId] = {};

		storeLaunchFromAppInfo[gameId][launch_id] = launch;
	}

	async function readLaunchs() {
		if (appinfo == null) return;
		storeLaunchFromAppInfo = {};
		storeLaunchsFromAppInfo = {};
		storeLaunchs = {};

		const gameIds = await Launch.getGameIDs();
		for (const gameId of gameIds) {
			const ai_launchs = getLaunchsFromAppInfo(gameId)!;
			const db_launchs = await Launch.getAllForGame(gameId).then(launchs => launchs.reduce((r, launch) => {
				r[launch.id] = launch;
				return r;
			}, {} as Record<number, Launch>));

			// Checking exsists laucnhs variants
			for (const key of ai_launchs.getKeys()) {
				const ai_launch = ai_launchs.getMap(key)!;
				const tag = ai_launch.getInt('slc_id');
				Logger.log(`Check launch ${tag ?? null} for game ${gameId}`)
				if (!tag) continue;

				setLaunch(gameId, tag, ai_launch);
				const db_launch = db_launchs[tag];
				if (!db_launch) {
					const launch = new Launch();
					launch.state = Launch.SteamState.NEED_DELETE;
					launch.id = tag;
					launch.game_id = gameId;
					launch.save();
					editLaunch(launch);
					continue;
				}
				delete db_launchs[tag];
				if (db_launch.state == Launch.SteamState.NEED_DELETE) {
					editLaunch(db_launch);
				} else {
					if (!await compareLaunchs(db_launch, ai_launch.toJSON(), (await Game.get(db_launch.game_id))!)) {
						if (db_launch.state == Launch.SteamState.NEED_EDIT) {
							editLaunch(db_launch);
						} else {
							db_launch.state = Launch.SteamState.NEED_EDIT;
							db_launch.save();
						}
					} else if (db_launch.state != Launch.SteamState.READY) {
						db_launch.state = Launch.SteamState.READY;
						db_launch.save();
					}
				}
			}

			// Checking not founded launchs
			for (const key in db_launchs) {
				const launch = db_launchs[key];
				if (launch.state == Launch.SteamState.NEED_DELETE) {
					launch.remove();
				} else {
					if (launch.state != Launch.SteamState.NEED_ADD) {
						launch.state = Launch.SteamState.NEED_ADD;
						launch.save();
					} else {
						editLaunch(launch);
					}
				}
			}

		}
	}
	let storeLaunchs = {} as Record<number, Launch>;
	export function editLaunch(launch: Launch) {
		console.log('editLaunch', launch);
		if (launch.state == Launch.SteamState.READY) {
			delete storeLaunchs[launch.id];
		} else {
			storeLaunchs[launch.id] = launch;
		}
		console.log('editLaunch (storeLaunchs)', storeLaunchs);
		changeState();
	}

	export async function init() {
		await Promise.all([
			readAppInfo(),
			readGames(),
		])

		await readLaunchs();

		changeState();
	}

	const SLCW_PATH = DEV ? resolve(process.cwd(), "steam-launch-custom-wrapper/dist/slc_wrapper.exe") : resolve(ASAR_ROOT, 'slc_wrapper.exe');
	async function getSLCWPath(library: string) {
		const slcw_executable = resolve(library, 'slcw.exe');

		if (!await exsist(slcw_executable))
			await copyFile(SLCW_PATH, slcw_executable);

		return slcw_executable;
	}

	async function getLuanchOptions(game: Game, launch: Launch) {
		let execute = relative(game.path, launch.execute);
		let workdir = relative(game.path, launch.workdir || dirname(launch.execute));
		let args = launch.launch.length ? `"${launch.launch.join('" "')}"` : "";
		if (/^[A-Z]:/.test(execute) || /^[A-Z]:/.test(workdir)) {
			Logger.log(`Can't get relative path for launch ${launch.id}. Game path: ${game.path}. Executable: ${launch.execute}. Workdir:  ${launch.workdir}`);
			args = `"${execute}" --wd="${workdir}" ` + args;
			execute = relative(game.path, await getSLCWPath(game.library));
			workdir = dirname(execute);
		}

		console.log("[getLuanchOptions]", game.id, args);
		return {
			execute, workdir, args
		}
	}

	async function writeAppInfo() {
		if (!appinfo) return;
		const all_launchs = Object.values(storeLaunchs);
		for (const launch of all_launchs) {
			const game = (await Game.get(launch.game_id))!;
			switch (launch.state) {
				case Launch.SteamState.NEED_ADD: {
					const ai_launch = new Map<VDFBLaunch>();
					ai_launch.setString('description', launch.name);

					const { execute, workdir, args } = await getLuanchOptions(game, launch);

					ai_launch.setString('executable', execute);
					ai_launch.setString('workingdir', workdir);
					ai_launch.setString('arguments', args);
					ai_launch.setInt('slc_id', launch.id);
					ai_launch.setMap('config', new Map<VDFBLaunch['config']>().setString('oslist', 'windows'))
					const launchs = getLaunchsFromAppInfo(launch.game_id)!;
					const keys = launchs.getKeys().map(key => parseInt(key as string)).sort();
					let key = 0;
					for (const i of keys) {
						if (i == key) key++;
						else break;
					}
					launchs.setMap(key, ai_launch);

					launch.state = Launch.SteamState.READY;
					launch.save();
				} break;
				case Launch.SteamState.NEED_EDIT: {
					const ai_launch = getLaunch(launch.game_id, launch.id)!;
					ai_launch.setString('description', launch.name);

					const { execute, workdir, args } = await getLuanchOptions(game, launch);

					ai_launch.setString('executable', execute);
					ai_launch.setString('workingdir', workdir);
					ai_launch.setString('arguments', args);

					launch.state = Launch.SteamState.READY;
					launch.save();
				} break;
				case Launch.SteamState.NEED_DELETE: {
					const launchs = getLaunchsFromAppInfo(launch.game_id)!;
					const key = launchs.getKeys().find(key => launchs.getMap(key)!.getInt('slc_id') == launch.id);
					if (key) launchs.delete(key);
					launch.remove();
				} break;
			}
		}

		writeFile(steam.pathToAppInfo, VKVB.serializate(appinfo));
	}
	async function resetAppInfo() {
		if (!appinfo) return;
		const gameIds = await Launch.getGameIDs();
		for (const gameId of gameIds) {
			const launchs = await Launch.getAllForGame(gameId);
			const ai_launchs = getLaunchsFromAppInfo(gameId);
			if (!ai_launchs) continue;
			const keys = ai_launchs.getKeys()
			for (const launch of launchs) {
				const key = keys.find(key => ai_launchs.getMap(key)?.getInt('slc_id') == launch.id);
				if (key) ai_launchs.delete(key);
			}
		}
		writeFile(steam.pathToAppInfo, VKVB.serializate(appinfo!));
	}

	async function writeDefault() {
		const all_games = Object.values(storeGames);
		const games = all_games.filter(game => game.installed && game.needWrite);
		const { configured, reset } = all_games.reduce((r, game) => {
			r[game.configured ? 'configured' : 'reset'].push(game.id);
			return r;
		}, { configured: [] as number[], reset: [] as number[] });

		const editedGames = [
			...await steam.setLaunchOptions(configured),
			...await steam.resetLaunchOptions(reset),
		];

		if (await steam.writeLocalConfig())
			await Promise.all(games.map(game => {
				if (editedGames.indexOf(game.id) == -1) return;
				game.needWrite = false;
				return game.save()
			}));
		return editedGames;
	}
	async function resetDefault() {
		const all_games = (await Game.getAll(undefined, undefined, null, { configured: true }));
		await steam.resetLaunchOptions(all_games.map(e => e.id));
		await steam.writeLocalConfig();
		all_games.forEach(g => { g.needWrite = true; g.save() });
	}

	async function write() {
		const steamWasBeenRun = await steam.isRunning();
		await steam.stop();

		const usageAppInfo = await Settings.getBoolean(USE_APPINFO, false);
		let editedGames: number[] = [];
		if (usageAppInfo) {
			writeAppInfo();
			resetDefault();
		} else {
			editedGames = await writeDefault();
			resetAppInfo();
		}

		changeState(usageAppInfo);


		steamWasBeenRun && await steam.start();
		return editedGames;
	}

	let needWrite = false;
	async function changeState(usageAppInfo?: boolean) {
		usageAppInfo = usageAppInfo ?? await Settings.getBoolean(USE_APPINFO, false);

		if (usageAppInfo) {
			const new_state = Object.values(storeLaunchs).length > 0;
			// console.log(storeLaunchs);
			Logger.log(`Change configure state from ${needWrite} to ${new_state}. Usage AppInfo.VDF`, { prefix: 'Configure' });
			if (needWrite == new_state) return;
			needWrite = new_state;
		} else {
			const new_state = Object.values(storeGames).length > 0;
			Logger.log(`Change configure state from ${needWrite} to ${new_state}. Not usage AppInfo.VDF`, { prefix: 'Configure' });
			if (needWrite == new_state) return;
			needWrite = new_state;
		}
		onChangeState(needWrite);
	}
	Settings.on(USE_APPINFO, async (_: string, value: string) => {
		const usageAppInfo = parseBoolean(value) ?? false;
		if (value) {
			await readLaunchs();
		} else {
			await readGames();
		}
		changeState(usageAppInfo);
	});

	let onChangeState: ChangeStateListener = () => void 0;
	export function IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.write, () => write());
		ipc.handle(Messages.canUseAppInfo, () => canUseAppInfo);
		ipc.handle(Messages.getState, () => needWrite);
		onChangeState = (state) => ipc.send(Messages.changeState, state);
	}
}

export default Configure;
