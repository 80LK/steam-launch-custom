import { IGame } from "@shared/Game";
import Settings from "./Database/Settings";
import { IPCTunnel } from "./IPCTunnel";
import { ChangeStateListener, Messages, USE_APPINFO } from "@shared/Configure";
import Logger from "./Logger";
import parseBoolean from "@utils/parseBoolean";
import VKVB, { AppInfo, MapWithHeader } from "valve-key-values-binary";
import Steam from "./Steam";
import { readFile } from "fs/promises";
import Game from "./Database/Game";

namespace Configure {
	const steam = Steam.get();
	const storeGames = {} as Record<number, boolean>;
	let canUseAppInfo = true;

	let appinfo: MapWithHeader<AppInfo> | null = null;
	export async function init() {
		try {
			const buffer = await readFile(steam.pathToAppInfo);
			const map = VKVB.parse(buffer);
			if (!VKVB.isAppInfo(map))
				throw new Error('Is not AppInfo');

			appinfo = map;
		} catch (e) {
			Logger.error("Can't read AppInfo");
			Settings.setBoolean(USE_APPINFO, false);
			canUseAppInfo = false;
		}
	}

	export function editGames(games: Pick<IGame, 'id' | 'needWrite'>[]) {
		games.forEach(({ id, needWrite }) => { storeGames[id] = needWrite });
		changeState();
	}
	export function editGame(id: number, needWrite: boolean) {
		storeGames[id] = needWrite;
		changeState();
	}

	export function editLaunch() {

	}

	async function write() {
		const steamWasBeenRun = await steam.isRunning();
		await steam.stop();

		const usageAppInfo = await Settings.getBoolean(USE_APPINFO, false);
		let editedGames: number[] = [];
		if (usageAppInfo) {

		} else {
			const all_games = await Game.needWrite();
			const games = all_games.filter(game => game.installed && game.needWrite);
			const { configured, reset } = all_games.reduce((r, game) => {
				r[game.configured ? 'configured' : 'reset'].push(game.id);
				return r;
			}, { configured: [] as number[], reset: [] as number[] });

			editedGames = [
				...await steam.setLaunchOptions(configured),
				...await steam.resetLaunchOptions(reset),
			];

			if (await steam.writeLocalConfig())
				await Promise.all(games.map(game => {
					if (editedGames.indexOf(game.id) == -1) return;
					game.needWrite = false;
					return game.save()
				}));
		}

		changeState(usageAppInfo);


		steamWasBeenRun && await steam.start();
		return editedGames;
	}

	let state = false;
	async function changeState(usageAppInfo?: boolean) {
		usageAppInfo = usageAppInfo ?? await Settings.getBoolean(USE_APPINFO, false);

		if (usageAppInfo) {
			const new_state = false;
			Logger.log(`Change configure state from ${state} to ${new_state}. Usage AppInfo.VDF`, { prefix: 'Configure' });
			if (state == new_state) return;
			state = new_state;
		} else {
			const new_state = Object.values(storeGames).indexOf(true) != -1;
			Logger.log(`Change configure state from ${state} to ${new_state}. Not usage AppInfo.VDF`, { prefix: 'Configure' });
			if (state == new_state) return;
			state = new_state;
		}
		onChangeState(state);
	}
	Settings.on(USE_APPINFO, (_: string, value: string) => {
		const usageAppInfo = parseBoolean(value) ?? false;
		changeState(usageAppInfo);
	});

	let onChangeState: ChangeStateListener = () => void 0;
	export function IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.write, () => write());
		ipc.handle(Messages.canUseAppInfo, () => canUseAppInfo);
		ipc.handle(Messages.getState, () => state);
		onChangeState = (state) => ipc.send(Messages.changeState, state);
	}
}

export default Configure;
