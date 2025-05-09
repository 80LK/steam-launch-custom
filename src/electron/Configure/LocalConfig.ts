import Value from "@utils/Value";
import Game from "../Database/Game";
import Steam, { TestLaunch } from "../Steam";

namespace LocalConfig {
	export const needWrite = new Value(true);

	export async function init(): Promise<boolean> {
		const steam = Steam.get();
		const libraries = await steam.getLibraries();

		const registeredGames = (await Game.getAll(undefined, undefined, null)).reduce((r, game) => { r[game.id] = game; return r; }, {} as Record<number, Game>)

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
						if (test == TestLaunch.NO && !registerd.configured) continue;
						if (test == TestLaunch.CURRENT && registerd.configured) continue;
						addInStore(app_id);
					}
				} else if (manifest) {
					const game = Game.create(app_id, manifest.appstate.name, path, manifest.appstate.installdir);
					game.installed = true;
					if (test != TestLaunch.NO) {
						game.configured = true;
						if (test == TestLaunch.NOT_CURRENT)
							addInStore(app_id)
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

		console.log(store);
		needWrite.set(store.size > 0);

		return true;
	}
	export async function configure(game: Game) {
		const test = await Steam.get().testLaunchPath(game.id);
		if (game.configured) {
			if (test == TestLaunch.CURRENT) {
				deleteFromStore(game.id);
			} else {
				addInStore(game.id);
			}
		} else {
			if (test == TestLaunch.NO) {
				deleteFromStore(game.id);
			} else {
				addInStore(game.id);
			}
		}
		needWrite.set(store.size > 0);
	}
	export async function write() {
		const reset = [] as number[];
		const set = [] as number[];
		for (const app_id of store.values()) {
			const game = (await Game.get(app_id))!;
			(game.configured ? set : reset).push(app_id);
			store.delete(app_id);
		}

		// await Promise.all([
		await Steam.get().resetLaunchOptions(reset),
			await Steam.get().setLaunchOptions(set)
		// ])

		await Steam.get().writeLocalConfig();
		needWrite.set(store.size > 0);
	}
	export async function reset() {
		const game_ids = (await Game.getAll(undefined, undefined, null, { installed: true })).map(game => { addInStore(game.id); return game.id });
		await Steam.get().resetLaunchOptions(game_ids);
		await Steam.get().writeLocalConfig();
		needWrite.set(store.size > 0);
	}

	const store = new Set<number>();
	function addInStore(game_id: number) {
		store.add(game_id);
	}
	function deleteFromStore(game_id: number) {
		store.delete(game_id);
	}
}

export default LocalConfig;
