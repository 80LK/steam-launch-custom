<script setup lang="ts">
const { gap, padding } = defineProps<{ padding?: string, gap?: string }>();
const _gap = gap || '20px';
const _padding = padding || _gap;

</script>
<template>
	<div :class="$style.container">
		<slot></slot>
	</div>
</template>

<style lang="css" module>
.container {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: v-bind('_gap');
	padding: v-bind('_padding');
}

.container>* {
	flex: 1;
}
</style>
