<script setup lang="ts">
import type { VInfiniteScroll } from 'vuetify/components';

const emit = defineEmits(['load']);

const onLoad: VInfiniteScroll['$props']['onLoad'] = ({ done }) => {
	if (!_done) _done = done;
	emit('load', done);
};
type Done = Parameters<typeof onLoad>[0]['done'];
let _done: Done | undefined = undefined;
function reset() {
	if (_done)
		_done('ok');
}

defineExpose({ reset })
export type { Done };
</script>

<template>
	<v-infinite-scroll :onLoad="onLoad">
		<slot />
		<template v-slot:empty></template>
	</v-infinite-scroll>
</template>
