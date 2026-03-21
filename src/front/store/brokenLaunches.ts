import { defineStore } from "pinia";
import { ILaunch } from "@shared/Launch";
import { IGame } from "@shared/Game";
import useGamesStore from "./games";
import { computed, ref } from "vue";
import useLaunchStore from "./launch";

const useBrokenLaunches = defineStore('broken_launches', () => {
	const launches = useLaunchStore();

	const list = ref({} as Record<number, { game: IGame, launches: ILaunch[] }>);
	const count = computed(() => Object.values(list.value).reduce((l, arr) => l + arr.launches.length, 0));

	async function loadList() {
		const map = await Configure.getBrokenLaunches();

		for (const key in map) {
			const game_id = parseInt(key);
			list.value[game_id] = {
				game: await useGamesStore().get(game_id),
				launches: await Promise.all(map[key].map(id => launches.get(id, true)))
			}
		}
	}

	loadList();


	async function fix(launch: ILaunch) {
		console.log("Fix???")
		await loadList();

		if (launch.broken) return;

		remove(launch);
	}

	function remove(launch: ILaunch) {
		list.value[launch.game_id].launches = list.value[launch.game_id].launches.filter(l => l.id != launch.id);
		if (list.value[launch.game_id].launches.length == 0)
			delete list.value[launch.game_id];
	}

	return { list, count, fix, remove };
});

export default useBrokenLaunches;
