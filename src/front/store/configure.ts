import { defineStore } from "pinia";
import { ref } from "vue";
// import useGamesStore from "./games";

const useConfigure = defineStore('configure', () => {
	const needWrite = ref(false);
	Configure.checkNeedWrite().then(v => needWrite.value = v);
	Configure.onChangeNeedWrite((v) => needWrite.value = v);

	const canUseAppInfo = ref(true);
	Configure.canUseAppInfo().then(v => canUseAppInfo.value = v);
	const useAppInfo = ref(false);
	Configure.useAppInfo().then(v => useAppInfo.value = v);



	return {
		get canUseAppInfo() {
			return canUseAppInfo
		},
		get useAppInfo() {
			return useAppInfo;
		},
		get needWrite() {
			return needWrite
		},
		setUseAppInfo(value: boolean) {
			Configure.setUseAppInfo(value);
			useAppInfo.value = value;
		},
		write() {
			return Configure.write();
		}
	};
});

export default useConfigure;
