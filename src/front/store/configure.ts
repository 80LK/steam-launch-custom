import { defineStore } from "pinia";
import { ref } from "vue";
import useGamesStore from "./games";

const useConfigure = defineStore('configure', () => {
	const state = ref(false)
	const { storage } = useGamesStore();

	Configure.getState().then(value => state.value = value);
	Configure.onChangeState((new_state) => state.value = new_state);

	async function write() {
		const games = await Configure.wrtie();
		for (const id of games) {
			storage[id].needWrite = false;
		}
	}

	return {
		get() { return state },
		write
	};
});

export default useConfigure;
