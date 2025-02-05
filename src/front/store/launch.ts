import { ILaunch } from "@shared/Launch";
import { defineStore } from "pinia";
import { ref } from "vue";

const useLaunchStore = defineStore('launch', () => {
	const launchsStore = ref({} as Record<number, ILaunch>);

	async function getForGame(game_id: number, offset: number, limit: number): Promise<ILaunch[]> {
		const launchs = await Launch.getForGame(game_id, offset, limit);
		launchs.forEach(launch => launchsStore.value[launch.id] = launch);
		return launchs;
	}

	function get(id: number) {
		return launchsStore.value[id];
	}

	function edit(launch: ILaunch) {
		return Launch.edit(launch)
	}

	async function create(launch: ILaunch) {
		const newLaunch = await Launch.create(launch);
		if (!newLaunch) return;

		launchsStore.value[newLaunch.id] = newLaunch;
		return newLaunch;
	}

	async function remove(launch_id: number) {
		if (await Launch.remove(launch_id))
			delete launchsStore.value[launch_id];

	}

	return { get, getForGame, create, remove, edit };
});

export default useLaunchStore;
