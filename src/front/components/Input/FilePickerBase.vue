<script setup lang="ts">
import { FileType } from '@shared/App';
import { computed } from 'vue';
interface PropFilePickerBase {
	type?: FileType;
	defaultPath?: string;
}
const { type = { name: "Any files", extensions: ['*'] }, defaultPath } = defineProps<PropFilePickerBase>();

async function selectFile() {
	const result = await App.selectFile(type, defaultPath);
	if (result)
		value.value = result;
}

function clear() {
	value.value = '';
}

const value = defineModel<string>({ default: '' });
const isNotEmpty = computed(() => !!(value.value));
export type {
	PropFilePickerBase
};
</script>

<template>
	<slot v-bind="{ selectFile, value, isNotEmpty, clear }" />
</template>
