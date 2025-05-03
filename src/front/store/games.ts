import { GameFilter, IGame } from "@shared/Game";
import { defineStore } from "pinia";
import { reactive } from "vue";


interface GamesStorage {
	[key: number]: IGame,
}

const useGamesStore = defineStore('games', () => {
	const storage = reactive({} as GamesStorage);

	function get(id: number) {
		return storage[id];
	}

	async function stared(id: number, stared: boolean) {
		storage[id].stared = await Game.stared(id, stared);
	}
	async function configure(id: number) {
		Object.assign(storage[id], await Game.configure(id));
	}
	async function resetConfigure(id: number) {
		Object.assign(storage[id], await Game.resetConfigure(id));
	}

	const feed = reactive([] as IGame[]);
	async function load(limit: number, { search, ...filter }: GameFilter & { search?: string | null }): Promise<number> {
		search = search ?? null;

		const offset: number = feed.length;
		const games = await Game.getAll(offset, limit, search, filter);
		games.forEach(game => {
			feed.push(game);
			storage[game.id] = game;
		})

		return games.length;
	}
	function reset() {
		feed.splice(0)
	}

	return {
		storage,
		get,

		stared,
		configure,
		resetConfigure,

		feed,
		load,
		reset,
	};
})

export default useGamesStore;
