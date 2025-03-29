<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { FieldProps } from "./Input";
import parseBoolean from '@utils/parseBoolean';

type SwitchProps = Pick<FieldProps, 'readonly' | 'label'> & {
	color?: string;
	inset?: boolean;
};

const {
	readonly,
	label,
	color,
	inset = undefined
} = defineProps<SwitchProps>();

const { global } = useTheme()
const c_inset = computed(() => inset ?? parseBoolean(global.current.value.variables['switch-inset']) ?? false);
const model = defineModel();
</script>

<template>
	<v-switch :label="label" :readonly="readonly" v-model="model" v-bind="$attrs" :color="color" :inset="c_inset" />
</template>
