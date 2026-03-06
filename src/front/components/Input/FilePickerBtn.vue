<script setup lang="ts">
import FilePickerBase, { PropFilePickerBase } from './FilePickerBase.vue';

interface PropFilePicker extends PropFilePickerBase {
	label?: string;
	color?: string;
}

const { defaultPath, type, label, color = undefined } = defineProps<PropFilePicker>();
const value = defineModel({ default: '' })

</script>

<template>
	<FilePickerBase v-model="value" :default-path="defaultPath" :type="type" v-slot="{ value, selectFile }">
		<v-btn :color="color" @click="selectFile">
			{{ label }}
		</v-btn>
	</FilePickerBase>
</template>
