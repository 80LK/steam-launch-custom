import VKVB, { AppInfo as VKVBAppInfo, MapWithHeader, Map as VKVBMap } from "valve-key-values-binary";
import Launch from "../Database/Launch";
import { readFile, writeFile } from "fs/promises";
import Steam from "../Steam";
import Logger from "../Logger";
import Game from "../Database/Game";
import { dirname, relative } from "path";
import Wrapper from "../Wrapper";

namespace AppInfo {
	const HELP_KEY = 'slc_id';

	const needWriteLaunches = new Map<number, Set<number>>();
	function addInNeedWriteLaunches(game_id: number, launch_id: number) {
		if (!needWriteLaunches.has(game_id))
			needWriteLaunches.set(game_id, new Set());

		needWriteLaunches.get(game_id)!.add(launch_id);
	}
	function deleteInNeedWriteLaunches(game_id: number, launch_id: number) {
		if (!needWriteLaunches.has(game_id)) return;

		const launches = needWriteLaunches.get(game_id)!;
		launches.delete(launch_id);
		if (launches.size == 0) needWriteLaunches.delete(game_id);
	}
	const configuredLaunches = new Map<number, Set<number>>();
	function addInConfiguredLaunches(game_id: number, launch_id: number) {
		if (!configuredLaunches.has(game_id))
			configuredLaunches.set(game_id, new Set());

		configuredLaunches.get(game_id)!.add(launch_id);
	}
	function deleteInConfiguredLaunches(game_id: number, launch_id: number) {
		if (!configuredLaunches.has(game_id)) return;

		const launches = configuredLaunches.get(game_id)!;
		launches.delete(launch_id);
		if (launches.size == 0) configuredLaunches.delete(game_id);
	}

	export function needWrite() {
		return needWriteLaunches.size > 0;
	}

	export function hasConfigured() {
		return configuredLaunches.size > 0;
	}

	export async function init(): Promise<boolean> {
		try {
			const map = VKVB.parse(await readFile(Steam.get().pathToAppInfo))
			if (!VKVB.isAppInfo(map)) throw new ReferenceError('Not support current appinfo.vdf');
			appInfo = map;

			type LaunchKey = `${number}|${number}`;
			const registeredLaunches = (await Launch.getAll()).reduce((r, l) => {
				r[`${l.game_id}|${l.id}`] = l
				return r;
			}, {} as Record<LaunchKey, Launch>);

			await Promise.all(mapAppInfo(async ({ game_id, launch_id, launch }) => {
				const regKey: LaunchKey = `${game_id}|${launch_id}`;
				const db_launch = registeredLaunches[regKey];

				if (!db_launch) {
					addInNeedWriteLaunches(game_id, -launch_id);
					addInConfiguredLaunches(game_id, -launch_id);
				} else {
					if (db_launch.state == Launch.SteamState.NEED_DELETE) {
						addInNeedWriteLaunches(game_id, launch_id);
						addInConfiguredLaunches(game_id, launch_id);
					} else {
						const eq = await equal(db_launch, launch);
						if (eq && db_launch.state != Launch.SteamState.READY) {
							await db_launch.edit({ state: Launch.SteamState.READY }).save()
						} else if (!eq && db_launch.state != Launch.SteamState.NEED_EDIT) {
							await db_launch.edit({ state: Launch.SteamState.NEED_EDIT }).save()
						}

						switch (db_launch.state) {
							case Launch.SteamState.NEED_EDIT:
								addInNeedWriteLaunches(game_id, launch_id);
							case Launch.SteamState.READY:
								addInConfiguredLaunches(game_id, launch_id);
								break;
							default:
								break;
						}
					}

					delete registeredLaunches[regKey];
				}
			}));

			for (const regKey of (Object.keys(registeredLaunches) as LaunchKey[])) {
				const launch = registeredLaunches[regKey];

				if (launch.state == Launch.SteamState.NEED_DELETE) {
					await launch.remove();
				} else if (launch.state != Launch.SteamState.NEED_ADD) {
					await launch.edit({ state: Launch.SteamState.NEED_ADD }).save();
					addInNeedWriteLaunches(launch.game_id, launch.id);
				}
			}
			return true;
		} catch (e) {
			Logger.error(e instanceof Error ? e.message : (e as any).toString(), { prefix: "Configure" });
			e instanceof Error && Logger.error(`Stack: ${e.stack}`, { prefix: "Configure" });
			return false;
		}
	}
	export async function configure(launch: Launch) {
		const hasInAppInfo = findInAppInfo(launch);
		const equalInAppInfo = hasInAppInfo ? await equal(launch, hasInAppInfo) : false;

		switch (launch.state) {
			case Launch.SteamState.NEED_ADD:
				if (!hasInAppInfo) break;
				await launch.edit({ state: equalInAppInfo ? Launch.SteamState.READY : Launch.SteamState.NEED_EDIT }).save();
				break;
			case Launch.SteamState.NEED_EDIT:
				if (hasInAppInfo) {
					if (equalInAppInfo) await launch.edit({ state: Launch.SteamState.READY }).save();
					break;
				}
				await launch.edit({ state: Launch.SteamState.NEED_ADD }).save();
				break;
		}

		switch (launch.state) {
			case Launch.SteamState.NEED_ADD:
				addInNeedWriteLaunches(launch.game_id, launch.id);
				deleteInConfiguredLaunches(launch.game_id, launch.id);
				break;
			case Launch.SteamState.NEED_EDIT:
				addInNeedWriteLaunches(launch.game_id, launch.id);
				addInConfiguredLaunches(launch.game_id, launch.id);
				break;

			case Launch.SteamState.READY:
				addInConfiguredLaunches(launch.game_id, launch.id);
				deleteInNeedWriteLaunches(launch.game_id, launch.id);
				break;
			case Launch.SteamState.NEED_DELETE:
				if (hasInAppInfo) {
					addInConfiguredLaunches(launch.game_id, launch.id);
					addInNeedWriteLaunches(launch.game_id, launch.id);
				} else {
					deleteInNeedWriteLaunches(launch.game_id, launch.id);
					await launch.remove();
				}
				break;
		}
	}
	export async function write() {
		for (const game_id of needWriteLaunches.keys()) {
			const launches = getLaunchesInAppInfo(game_id);
			if (!launches) continue;

			mapLaunches(launches, ({ launch, key }) => {
				const launch_id = launch.getInt(HELP_KEY);
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
				ai_launch.setInt(HELP_KEY, launch.id);
				ai_launch.setString('description', launch.name);

				const { executable, workingdir, args } = await toAppInfo(launch);
				ai_launch.setString('executable', executable);
				ai_launch.setString('workingdir', workingdir);
				ai_launch.setString('arguments', args);
				launches.setMap(offset++, ai_launch);
				launch.edit({ state: Launch.SteamState.READY }).save();

				deleteInNeedWriteLaunches(launch.game_id, launch.id);
				addInConfiguredLaunches(launch.game_id, launch.id);
			}
		}

		await writeFile(Steam.get().pathToAppInfo, VKVB.serializate(appInfo!));
	}

	export async function reset() {
		if (!appInfo) return;

		const launches = await Launch.getAll();
		await Promise.all(
			launches.map(launch => {
				launch.state = Launch.SteamState.NEED_ADD;
				addInNeedWriteLaunches(launch.game_id, launch.id);
				deleteInConfiguredLaunches(launch.game_id, launch.id);
				return launch.save()
			})
		);
		mapAppInfo(({ key, launches }) => {
			launches.delete(key);
		});
		await writeFile(Steam.get().pathToAppInfo, VKVB.serializate(appInfo));
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
				const launch_id = launch.getInt(HELP_KEY);
				if (launch_id == null) return;

				arr.push(callback({ key, game_id: parseInt(game_id as string), launch_id, launch, launches }));
			})
		}
		return arr;
	}

	type LaunchInfo = VKVBAppInfo[number]['appinfo']['config']['launch'][number] & { [HELP_KEY]: number };
	type Launches = LaunchInfo[];

	async function toAppInfo(launch: Launch) {
		const game = (await Game.get(launch.game_id))!;


		let executable = relative(game.path, launch.execute);
		let workingdir = relative(game.path, launch.workdir || dirname(executable));
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
			const launch_id = ai_launch.getInt(HELP_KEY);
			if (launch_id == null) continue;

			if (launch_id == launch.id)
				return ai_launch;
		}

		return null;
	}
}

export default AppInfo;
