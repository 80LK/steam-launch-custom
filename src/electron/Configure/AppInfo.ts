import Value from "@utils/Value";
import VKVB, { AppInfo as VKVBAppInfo, MapWithHeader, Map as VKVBMap } from "valve-key-values-binary";
import Launch from "../Database/Launch";
import { readFile, writeFile } from "fs/promises";
import Steam from "../Steam";
import Logger from "../Logger";
import Game from "../Database/Game";
import { dirname, relative } from "path";
import Wrapper from "../Wrapper";

namespace AppInfo {
	export const needWrite = new Value(false);

	export async function init(): Promise<boolean> {
		try {
			const map = VKVB.parse(await readFile(Steam.get().pathToAppInfo))
			if (!VKVB.isAppInfo(map)) throw new ReferenceError('Not support current appinfo.vdf');
			appInfo = map;

			const registeredLaunches = (await Launch.getAll()).reduce((r, l) => {
				r[`${l.game_id}|${l.id}`] = l
				return r;
			}, {} as Record<string, Launch>);

			await Promise.all(mapAppInfo(async ({ game_id, launch_id, launch }) => {
				const regKey = `${game_id}|${launch_id}`;
				const db_launch = registeredLaunches[regKey];
				if (!db_launch) {
					addInStore({ id: -launch_id, game_id });
				} else {

					if (db_launch.state == Launch.SteamState.NEED_DELETE) {
						addInStore(db_launch);
					} else {
						if (await equal(db_launch, launch)) {
							if (db_launch.state != Launch.SteamState.READY) {
								await db_launch.edit({ state: Launch.SteamState.READY }).save();
							}
						} else {
							if (db_launch.state != Launch.SteamState.NEED_EDIT)
								await db_launch.edit({ state: Launch.SteamState.NEED_EDIT }).save();
							addInStore(db_launch);
						}
					}

					delete registeredLaunches[regKey];
				}
			}));

			for (const launch of Object.values(registeredLaunches)) {
				if (launch.state == Launch.SteamState.NEED_DELETE) {
					launch.remove();
				} else {
					if (launch.state != Launch.SteamState.NEED_ADD)
						await launch.edit({ state: Launch.SteamState.NEED_ADD }).save();

					addInStore(launch);
				}
			}

			needWrite.set(storeGames.size > 0);

			return true;
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : (e as any).toString(), { prefix: "Configure" });
			e instanceof Error && Logger.error(`Stack: ${e.stack}`, { prefix: "Configure" });
			return false;
		}
	}
	export async function configure(launch: Launch) {
		console.log(launch);
		switch (launch.state) {
			case Launch.SteamState.NEED_ADD:
			case Launch.SteamState.NEED_EDIT: {
				if (await hasValidInAppInfo(launch)) {
					launch.edit({ state: Launch.SteamState.READY }).save();
					deleteFromStore(launch);
				} else {
					addInStore(launch);
				}
			} break;
			case Launch.SteamState.NEED_DELETE: {
				if (findInAppInfo(launch)) {
					addInStore(launch);
				} else {
					deleteFromStore(launch);
					launch.remove();
				}
			} break;

		}
		console.log(storeGames);
		needWrite.set(storeGames.size > 0);
	}
	export async function write() {

		for (const game_id of storeGames.keys()) {
			const launches = getLaunchesInAppInfo(game_id);
			if (!launches) continue;

			mapLaunches(launches, ({ launch, key }) => {
				const launch_id = launch.getInt('slc_id');
				if (launch_id == null) return;
				launches.delete(key);
			})

			const db_launches = await Launch.getAllForGame(game_id);
			let offset = launches.getKeys().reduce((r: number, k) => Math.max(r, parseInt(k as string)), 0) + 1;
			for (const launch of db_launches) {
				if (launch.state == Launch.SteamState.NEED_DELETE) {
					launch.remove();
					continue;
				}
				const ai_launch = new VKVBMap<LaunchInfo>();
				ai_launch.setInt('slc_id', launch.id);
				ai_launch.setString('description', launch.name);

				const { executable, workingdir, args } = await toAppInfo(launch);
				ai_launch.setString('executable', executable);
				ai_launch.setString('workingdir', workingdir);
				ai_launch.setString('arguments', args);
				launches.setMap(offset++, ai_launch);
				launch.edit({ state: Launch.SteamState.READY }).save();
			}

			storeGames.delete(game_id);
		}

		await writeFile(Steam.get().pathToAppInfo, VKVB.serializate(appInfo!));

		needWrite.set(storeGames.size > 0);
	}

	export async function reset() {
		const launches = await Launch.getAll();
		await Promise.all(
			launches.map(launch => {
				launch.state = Launch.SteamState.NEED_ADD;
				getStore(launch.game_id).add(launch.id)
				return launch.save()
			})
		);
		mapAppInfo(({ key, launches }) => {
			launches.delete(key);
		});
		needWrite.set(storeGames.size > 0);
	}

	let appInfo: MapWithHeader<VKVBAppInfo> | null = null;

	function mapLaunches<T>(launches: VKVBMap<Launches>, callback: (opt: { launch: VKVBMap<LaunchInfo>, launches: VKVBMap<Launches>, key: string | number }) => T): T[] {
		const arr = [] as T[];
		for (const key of launches.getKeys()) {
			const launch = launches.getMap(key)!;
			arr.push(callback({ launch, key, launches }));
		}
		return arr;
	}
	function mapAppInfo<T>(callback: (opt: { game_id: number, launch_id: number, launch: VKVBMap<LaunchInfo>, launches: VKVBMap<Launches>, key: string | number }) => T): T[] {
		if (!appInfo) return [];

		const arr = [] as T[];
		for (const game_id of appInfo.getKeys()) {
			const game = appInfo.getMap(game_id);
			if (!game) continue;
			const launches = game.getMap('appinfo')?.getMap('config')?.getMap('launch') as (VKVBMap<Launches> | null);
			if (!launches) continue;
			mapLaunches(launches, ({ launch, key, launches }) => {
				const launch_id = launch.getInt('slc_id');
				if (launch_id == null) return;

				arr.push(callback({ key, game_id: parseInt(game_id as string), launch_id, launch, launches }));
			})
		}
		return arr;
	}
	const storeGames = new Map<number, Set<number>>();
	function getStore(game_id: number) {
		if (!storeGames.has(game_id))
			storeGames.set(game_id, new Set());

		return storeGames.get(game_id)!;
	}
	function addInStore({ id, game_id }: Pick<Launch, 'id' | 'game_id'>) {
		if (!storeGames.has(game_id)) storeGames.set(game_id, new Set());

		const store = storeGames.get(game_id)!;
		store.add(id);
	}
	function deleteFromStore({ id, game_id }: Pick<Launch, 'id' | 'game_id'>) {
		if (!storeGames.has(game_id)) return;

		const store = storeGames.get(game_id)!
		store.delete(id);

		if (store.size == 0) storeGames.delete(game_id);
	}

	type LaunchInfo = VKVBAppInfo[number]['appinfo']['config']['launch'][number] & { "slc_id": number };
	type Launches = LaunchInfo[];

	async function toAppInfo(launch: Launch) {
		const game = (await Game.get(launch.game_id))!;

		let executable = relative(game.library, launch.execute);
		let workingdir = relative(game.library, launch.workdir);
		let args = launch.launch.length ? `"${launch.launch.join('" "')}"` : "";
		if (/^[A-Z]:/.test(executable) || /^[A-Z]:/.test(workingdir)) {
			Logger.log(`Can't get relative path for launch ${launch.id}. Game path: ${game.path}. Executable: ${launch.execute}. Workdir:  ${launch.workdir}. Set wrapper.`, { prefix: 'Configure][AppInfo' });
			args = `"${executable}" --wd="${workingdir}" ` + args;
			executable = relative(game.path, Wrapper.getPath(game.library));
			workingdir = dirname(executable);
		}

		return { executable, workingdir, args }
	}

	async function equal(db: Launch, ai: VKVBMap<LaunchInfo>): Promise<boolean> {

		if (ai.getString('description') != db.name) return false;

		const db_to_ai = await toAppInfo(db);

		if (ai.getString('executable') != db_to_ai.executable) return false
		if (ai.getString('workingdir') != db_to_ai.workingdir) return false
		if (ai.getString('arguments') != db_to_ai.args) return false

		return true;
	}
	function getLaunchesInAppInfo(game_id: number) {
		if (!appInfo) return null;
		const game = appInfo.getMap(game_id);
		if (!game) return null;
		const launches = game.getMap('appinfo')?.getMap('config')?.getMap('launch');
		if (!launches) return null;
		return launches as VKVBMap<Launches>;
	}
	function findInAppInfo(launch: Launch) {
		const launches = getLaunchesInAppInfo(launch.game_id);
		if (!launches) return null;
		for (const key of launches.getKeys()) {
			const ai_launch = launches.getMap(key)! as VKVBMap<LaunchInfo>;
			const launch_id = ai_launch.getInt('slc_id');
			if (launch_id == null) continue;

			if (launch_id == launch.id)
				return ai_launch;
		}

		return null;
	}
	function hasValidInAppInfo(launch: Launch): Promise<boolean> {
		const ai_launch = findInAppInfo(launch);
		if (!ai_launch) return Promise.resolve(false);

		return equal(launch, ai_launch);
	}
}

export default AppInfo;
