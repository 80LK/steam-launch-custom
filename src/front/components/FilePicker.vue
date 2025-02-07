<script setup lang="ts">
import { FileType } from '@shared/App';
import { computed } from 'vue';

const { type = { name: "Any files", extensions: ['*'] }, defaultPath } = defineProps<{ type?: FileType, defaultPath?: string }>();

async function selectFile() {
	const result = await App.selectFile(type, defaultPath);
	if (result)
		value.value = result;
}

const value = defineModel<string>({ default: '' });
const isNotEmpty = computed(() => !!(value.value));
</script>

<template>
	<slot v-bind="{ selectFile, value, isNotEmpty }" />
</template>
