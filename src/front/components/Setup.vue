<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import InitState, { INIT_MESSAGE } from "../../SteamInitState";

const emit = defineEmits(['ready']);
const state = ref(InitState.INIT)
const statusMessage = ref(INIT_MESSAGE);

function changeState(s: InitState, m: string) {
	state.value = s;
	statusMessage.value = m;
	if (s == InitState.READY) emit('ready');
}
let changeStateListener = 0;
onMounted(() => {
	Steam.getCurrentState().then((s) => changeState(s.state, s.message))
	changeStateListener = Steam.onChangeInitState(changeState);
})
onUnmounted(() => {
	Steam.offChangeInitState(changeStateListener);
})
</script>

<template>
	<div :class="$style.setup">
		<h2 class="mb-5">{{ statusMessage }}</h2>
		<v-progress-circular indeterminate :size="110" :width="10" />
	</div>
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
