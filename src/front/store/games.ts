import { IGame } from "@shared/Game";
import { defineStore } from "pinia";
import { ref } from "vue";


interface GamesStorage {
	[key: number]: IGame,
	needWrite: boolean
}

const useGamesStore = defineStore('games', () => {
	const needWrite = ref(false);
	Game.needWrite().then(e => needWrite.value = e);
	const gamesStorage = ref({} as GamesStorage);

	async function getAll(offset: number, limit: number, search: string | null) {
		const games = await Game.getAll(offset, limit, search);
		games.forEach(game => gamesStorage.value[game.id] = game);
		return games;
	}
	function get(id: number) {
		return gamesStorage.value[id];
	}

	async function stared(id: number, stared: boolean) {
		gamesStorage.value[id].stared = await Game.stared(id, stared);
	}
	async function configure(id: number) {
		if (!await Game.configure(id)) return;

		gamesStorage.value[id].configured = true;
		gamesStorage.value[id].needWrite = !gamesStorage.value[id].needWrite;
		needWrite.value = await Game.needWrite();
	}
	async function resetConfigure(id: number) {
		if (!await Game.resetConfigure(id)) return;

		gamesStorage.value[id].configured = false;
		gamesStorage.value[id].needWrite = !gamesStorage.value[id].needWrite;
		needWrite.value = await Game.needWrite();
	}

	async function write() {
		const ids = await Game.write();
		for (const id of ids) {
			gamesStorage.value[id].needWrite = false;
		}
		needWrite.value = await Game.needWrite();
	}

	return { needWrite, games: gamesStorage, getAll, stared, get, configure, resetConfigure, write };
})

export default useGamesStore;
