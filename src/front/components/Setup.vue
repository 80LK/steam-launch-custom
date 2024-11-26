<script setup lang="ts">
import { ref } from "vue"
const statusMessage = ref('Init');
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
