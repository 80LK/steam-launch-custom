<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { FieldProps, Variant } from "./Input";

type ComboboxProps = FieldProps & {
	chips?: boolean;
	closableChips?: boolean;
	multiple?: boolean;
	hint?: string;
};

const {
	readonly,
	label,
	variant,
	density,
	rules,
	clearable,
	prependInnerIcon,
	forceLabel = false,
	chips = false,
	closableChips = false,
	multiple = false,
	hint
} = defineProps<ComboboxProps>();

const { global } = useTheme()
const c_variant = computed(() => variant || global.current.value.variables['input-variant'] as Variant || undefined);
const c_label = computed(() => c_variant.value != 'solo' || forceLabel ? label : undefined);
const c_placeholder = computed(() => c_variant.value == 'solo' && !forceLabel ? label : undefined);
const c_density = computed(() => density || c_variant.value == 'solo' && forceLabel ? 'comfortable' : undefined);

const model = defineModel<readonly any[]>();

const emit = defineEmits([
	'paste'
]);
</script>

<template>
	<v-combobox :prepend-inner-icon="prependInnerIcon" :label="c_label" :variant="c_variant" :clearable="clearable"
		v-model="model" :placeholder="c_placeholder" :rules="rules" :density="c_density" :readonly="readonly"
		:chips="chips" :multiple="multiple" :closable-chips="closableChips" :hint="hint" v-bind="$attrs"
		@paste="(...args: any[]) => emit('paste', ...args)" />
</template>
