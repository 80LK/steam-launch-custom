import { UpdateState } from "@shared/Updater";
import { defineStore } from "pinia";
import { ref } from "vue";
import { version as CURRENT_VERSION } from "../../../package.json";


const useUpdaterStore = defineStore('updater', () => {
	const state = ref(UpdateState.INIT);
	const version = ref(CURRENT_VERSION);

	async function check() {
		if (state.value != UpdateState.INIT) return;
		state.value = UpdateState.CHECK;
		const result = await Updater.check();
		state.value = result.state;
		version.value = result.version;
	}

	async function download() {
		if (state.value != UpdateState.HAVE) return;

		state.value = UpdateState.DOWNLOADING;
		state.value = await Updater.download() ? UpdateState.DOWNLOADED : UpdateState.HAVE;
	}

	return {
		state, version, check, download
	};
});

export default useUpdaterStore;
