<script setup lang="ts">
import type { VInfiniteScroll } from 'vuetify/components';
const { padding, isInfiniteScroll = false } = defineProps<{ padding?: string, isInfiniteScroll?: boolean }>();
const _padding = padding || '16px';

const emit = defineEmits(['load']);

const onLoad: VInfiniteScroll['$props']['onLoad'] = ({ done }) => {
	if (!_done) _done = done;
	emit('load', done);
};

type Done = Parameters<typeof onLoad>[0]['done'];
let _done: Done | undefined = undefined;
function reset() {
	if (_done) _done('ok');
}
function empty() {
	if (_done) _done('empty')
}
defineExpose({ reset, empty })
export type { Done };
</script>

<template>
	<div :class="$style.container">
		<div :class="$style.header">
			<slot name="header" />
		</div>
		<v-divider />

		<v-infinite-scroll :onLoad="onLoad" :class="$style.body" v-if="isInfiniteScroll">
			<slot />
			<template v-slot:empty>
				<slot name="empty" />
			</template>
		</v-infinite-scroll>

		<div :class="$style.body" v-else>
			<slot />
		</div>
	</div>
</template>

<style module>
.container {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
}

.container .header {
	padding: v-bind('_padding');
}

.container .body {
	padding: v-bind('_padding');
	overflow-y: auto;
	flex: 1;
}

.container .body :global(.v-infinite-scroll-intersect) {
	overflow: hidden;
}

.container .body :global(.v-infinite-scroll__side) {
	padding: 0;
}
</style>
