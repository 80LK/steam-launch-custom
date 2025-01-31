<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"

const statusMessage = ref("Initialization");
const setup = ref(true);

function changeState(m: string | null) {
	if (m == null) return setup.value = false;
	statusMessage.value = m;
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
	<div v-if="setup" :class="$style.setup">
		<h2 class="mb-5">{{ statusMessage }}</h2>
		<v-progress-circular indeterminate :size="110" :width="10" />
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
