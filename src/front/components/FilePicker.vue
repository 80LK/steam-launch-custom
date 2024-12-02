<script lang="ts" setup>
import { FileType } from '../../electron/App/App';
import { mdiFile } from '@mdi/js';
import { computed } from 'vue';
import { VTextField } from 'vuetify/components';
type IconValue = VTextField['$props']['clearIcon']
type Rules = VTextField['$props']['rules']

type FilePickerProps = {
	file?: FileType,
	icon?: IconValue
	variant?: "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled" | undefined,
	label?: string,
	defaultPath?: string,
	rules?: Rules
};

const {
	file = { name: "Any files", extensions: ['*'] },
	icon = mdiFile,
	variant,
	label,
	defaultPath = undefined,
	rules
} = defineProps<FilePickerProps>()

const value = defineModel<string>({ default: '' });
const isNotEmpty = computed(() => !!(value.value));


function selectFile() {
	App.selectFile(file, defaultPath).then(e => {
		if (!e) return;
		value.value = e;
	})
}

function focus(e: FocusEvent) {
	(<HTMLInputElement>e.target).blur();
}
</script>

<template>
	<v-input class="v-text-field cursor-pointer" v-slot:default="{ id, isValid, isValidating }" :rules="rules"
		v-model="value">
		<v-field :variant="variant" :label="label" :id="id.value" @click="selectFile()" :active="isNotEmpty"
			:error="isValid.value == false">
			<template v-slot:prepend-inner>
				<v-icon :icon="icon" class="cursor-pointer" />
			</template>
			<input :id="id.value" class="v-field__input cursor-pointer" @focus="focus" v-model="value" />

			<template v-slot:append-inner>
				<v-icon icon="$clear" v-if="isNotEmpty" @click.stop="value = ''" />
			</template>
		</v-field>
	</v-input>
</template>
