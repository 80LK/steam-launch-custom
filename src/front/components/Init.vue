<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import { type StateMessage, State } from "@shared/App";
import { mdiAlertOutline } from "@mdi/js";
import { useI18n } from "vue-i18n";
import useSettings from "../store/settings"
const { t } = useI18n();
const { init } = useSettings();
init();


const statusMessage = ref({ state: State.INIT, message: t("init.init") } as StateMessage);

function changeState(m: StateMessage) {
	statusMessage.value.message = t(m.message);
	statusMessage.value.state = m.state;
}
let changeStateListener = 0;
onMounted(() => {
	App.getCurrentInitState().then(message => changeState(message))
	changeStateListener = App.onChangeInitState(changeState);
})
onUnmounted(() => {
	App.offChangeInitState(changeStateListener);
})
</script>

<template>
	<div v-if="statusMessage.state != State.READY" :class="$style.setup">
		<h2 class="mb-5">{{ statusMessage.message }}</h2>
		<v-progress-circular indeterminate :size="110" :width="10" v-if="statusMessage.state == State.INIT" />
		<v-icon :icon="mdiAlertOutline" size="110" v-else-if="statusMessage.state == State.ERROR" />
	</div>
	<slot v-else />
</template>

<style module>
.setup {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
}
</style>
