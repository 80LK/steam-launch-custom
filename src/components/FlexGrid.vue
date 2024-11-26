<script setup lang="ts">

const props = defineProps<{ padding?: string, gap?: string }>();
const gap = props.gap || '20px';
const padding = props.padding || gap;

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
	gap: v-bind('gap');
	padding: v-bind('padding');
}
</style>
