<script setup lang="ts">
const { gap, padding, loading = false } = defineProps<{ padding?: string, gap?: string, loading?: boolean }>();
const _gap = gap || '20px';
const _padding = padding || gap;

</script>
<template>
	<div :class="[$style.container, { [$style.loading]: loading }]">
		<v-progress-circular indeterminate :size="110" :width="10" v-if="loading" />
		<slot v-else></slot>
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

.container.loading>* {
	flex: none;
}

.container>* {
	flex: 1;
}
</style>
