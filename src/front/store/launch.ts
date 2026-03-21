import { ILaunch } from "@shared/Launch";
import { defineStore } from "pinia";
import { ref } from "vue";

const useLaunchStore = defineStore('launch', () => {
	const launchsStore = ref({} as Record<number, ILaunch>);

	async function getForGame(game_id: number, offset: number, limit: number): Promise<ILaunch[]> {
		const launchs = await Launch.getForGame(game_id, offset, limit);
		launchs.forEach(launch => {
			if (launch.image) launch.image += "?" + Date.now();
			launchsStore.value[launch.id] = launch;
		});
		return launchs;
	}

	async function getAllForGame(game_id: number): Promise<ILaunch[]> {
		const launchs = await Launch.getAllForGame(game_id);
		launchs.forEach(launch => {
			if (launch.image) launch.image += "?" + Date.now();
			launchsStore.value[launch.id] = launch;
		});
		return launchs;
	}

	async function get(id: number, force: boolean = false) {
		if (!launchsStore.value[id] || force)
			launchsStore.value[id] = await Launch.get(id)
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

	function createShortcut(launch_id: number) {
		return Launch.createShortcut(launch_id);
	}

	return { get, getForGame, create, remove, edit, createShortcut, getAllForGame };
});

export default useLaunchStore;
