import Game from "../Database/Game";
import Steam, { TestLaunch } from "../Steam";
import Launch from "../Database/Launch";
import Logger from "../Logger";

namespace LocalConfig {
	const needWriteGames = new Set<number>();
	const configuredGames = new Set<number>();
	const brokenGamesLaunches = new Map<number, Set<number>>();

	export function needWrite() {
		return needWriteGames.size > 0;
	}
	export function hasConfigured() {
		return configuredGames.size > 0;
	}

	async function addInConfigured(app_id: number) {
		configuredGames.add(app_id);

		const launches = await Launch.getAllForGame(app_id);
		const brokenLaunches = new Set<number>();

		for (const launch of launches) {
			Logger.log(`Launch: ${JSON.stringify(launch)}. Broken: ${!launch.checkExsist()}`, { prefix: "BROKEN LAUNCHES" })
			if (!launch.checkExsist())
				brokenLaunches.add(launch.id);
		}

		if (brokenLaunches.size > 0)
			brokenGamesLaunches.set(app_id, brokenLaunches);
	}

	export function getBrokenLaunches(): Record<number, number[]> {

		const record = {} as Record<number, number[]>;
		for (const key of brokenGamesLaunches.keys()) {
			const launches = brokenGamesLaunches.get(key) ?? new Set();
			if (launches.size > 0)
				record[key] = Array.from(launches)
		}

		return record;
	}

	export async function init(): Promise<boolean> {
		const steam = Steam.get();
		const libraries = await steam.getLibraries();

		const registeredGames = (await Game.getAll(null, null, null)).reduce((r, game) => { r[game.id] = game; return r; }, {} as Record<number, Game>)

		for (const key in libraries) {
			const { path, apps } = libraries[key];
			for (const s_app_id in apps) {
				const app_id = parseInt(s_app_id);
				const manifest = await steam.getAppManifest(path, app_id);
				const test = await steam.testLaunchPath(app_id);
				const registerd = registeredGames[app_id];
				delete registeredGames[app_id];

				if (registerd) {
					registerd.installed = !!manifest;
					await registerd.save();
					if (manifest) {
						if (test == TestLaunch.NO) {
							if (registerd.countLaunches == 0) continue;
							else needWriteGames.add(app_id);
						} else if (test == TestLaunch.CURRENT && registerd.countLaunches > 0) {
							addInConfigured(app_id);
						} else {
							needWriteGames.add(app_id);
							addInConfigured(app_id);
						}
					}
				} else if (manifest) {
					const game = Game.create(app_id, manifest.appstate.name, path, manifest.appstate.installdir);
					game.installed = true;
					if (test != TestLaunch.NO) {
						addInConfigured(app_id);
						needWriteGames.add(app_id);
					}
					await game.save();
				}
			}
		}

		for (const app_id in registeredGames) {
			const game = registeredGames[app_id];
			game.installed = false;
			await game.save();
		}

		return true;
	}

	export async function write() {
		const reset = [] as number[];
		const set = [] as number[];
		for (const app_id of needWriteGames.values()) {
			const game = (await Game.get(app_id))!;
			(game.countLaunches > 0 ? set : reset).push(app_id);
			needWriteGames.delete(app_id);
			configuredGames[game.countLaunches > 0 ? 'add' : 'delete'](app_id);
		}

		// await Promise.all([
		await Steam.get().resetLaunchOptions(reset);
		await Steam.get().setLaunchOptions(set);
		// ])

		await Steam.get().writeLocalConfig();
	}
	export async function reset() {
		const game_ids = Array.from(configuredGames.values());
		game_ids.forEach(id => {
			configuredGames.delete(id);
			needWriteGames.add(id);
		});
		await Steam.get().resetLaunchOptions(game_ids);
		await Steam.get().writeLocalConfig();
	}

	export async function configure(launch: Launch) {
		const game = (await Game.get(launch.game_id))!;

		if (
			(game.countLaunches == 1 && launch.state == Launch.SteamState.NEED_ADD) ||
			(game.countLaunches == 0 && launch.state == Launch.SteamState.NEED_DELETE)
		) {
			needWriteGames[needWriteGames.has(game.id) ? 'delete' : 'add'](game.id);
		}

	}

}

export default LocalConfig;
