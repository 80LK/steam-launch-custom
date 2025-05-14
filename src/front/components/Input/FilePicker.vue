<script setup lang="ts">
import FilePickerBase, { PropFilePickerBase } from './FilePickerBase.vue';
import TextField from './TextField.vue';
import { IconValue, ValidationRule } from './Input';
import { mdiFile } from '@mdi/js';

interface PropFilePicker extends PropFilePickerBase {
	icon?: IconValue;
	label?: string;
	rules?: readonly ValidationRule[];
}

const { defaultPath, type, icon = mdiFile, label, rules = [] } = defineProps<PropFilePicker>();
const value = defineModel({ default: '' })

</script>

<template>
	<FilePickerBase v-model="value" :default-path="defaultPath" :type="type" v-slot="{ value, selectFile, clear }">
		<TextField :label="label" clearable :prepend-inner-icon="icon" :rules="rules" :model-value="value"
			@click:clear="clear" @click:control="selectFile" readonly />
	</FilePickerBase>
</template>
