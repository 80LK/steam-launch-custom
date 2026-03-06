import { defineStore } from "pinia";
import { ref } from "vue";

const useConfigure = defineStore('configure', () => {
	const needWrite = ref(false);
	Configure.checkNeedWrite().then(v => needWrite.value = v);
	Configure.onChangeNeedWrite((v) => needWrite.value = v);

	const canUseAppInfo = ref(true);
	Configure.canUseAppInfo().then(v => canUseAppInfo.value = v);
	const useAppInfo = ref(false);
	Configure.useAppInfo().then(v => useAppInfo.value = v);
	const integrateSteam = ref(true);
	Configure.integrateSteam().then(v => integrateSteam.value = v);

	return {
		get canUseAppInfo() {
			return canUseAppInfo
		},
		get useAppInfo() {
			return useAppInfo;
		},
		get integrateSteam() {
			return integrateSteam;
		},
		get needWrite() {
			return needWrite
		},
		setUseAppInfo(value: boolean) {
			Configure.setUseAppInfo(value);
			useAppInfo.value = value;
		},
		setIntegrateSteam(value: boolean) {
			Configure.setIntegrateSteam(value);
			integrateSteam.value = value;
		},
		write() {
			return Configure.write();
		}
	};
});

export default useConfigure;
