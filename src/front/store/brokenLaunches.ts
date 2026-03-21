import { defineStore } from "pinia";
import { ILaunch } from "@shared/Launch";
import { IGame } from "@shared/Game";
import useGamesStore from "./games";
import { computed, ref } from "vue";
import useLaunchStore from "./launch";

const useBrokenLaunches = defineStore('broken_launches', () => {
	const list = ref({} as Record<number, { game: IGame, launches: ILaunch[] }>);
	const count = computed(() => Object.values(list.value).reduce((l, arr) => l + arr.launches.length, 0));

	function log<T>(r: T, ...msg: string[]): T {
		console.log(...msg, r);
		return r;
	}

	Configure.getBrokenLaunches().then(async (map) => {
		for (const key in map) {
			const game_id = parseInt(key);
			list.value[game_id] = {
				game: log(await useGamesStore().get(game_id)),
				launches: (await useLaunchStore().getAllForGame(game_id)).filter(l => map[key].indexOf(l.id) != -1)
			}
		}
	});

	return { list, count };
});

export default useBrokenLaunches;
