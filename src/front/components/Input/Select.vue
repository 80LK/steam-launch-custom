<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { FieldProps, Variant } from "./Input";
type SelectProps = FieldProps & { items?: any[] };
const {
	readonly,
	label,
	variant,
	density,
	rules,
	clearable,
	prependInnerIcon,
	forceLabel = false,
	items
} = defineProps<SelectProps>();

const { global } = useTheme()
const c_variant = computed(() => variant || global.current.value.variables['input-variant'] as Variant || undefined);
const c_label = computed(() => c_variant.value != 'solo' || forceLabel ? label : undefined);
const c_placeholder = computed(() => c_variant.value == 'solo' && !forceLabel ? label : undefined);

const model = defineModel();

const emit = defineEmits([
	'update:modelValue'
]);
</script>

<template>
	<v-select :label="c_label" :placeholder="c_placeholder" :readonly="readonly" :density="density" v-model="model"
		:rules="rules" :variant="c_variant" :clearable="clearable" :prepend-inner-icon="prependInnerIcon" :items="items"
		v-bind="$attrs" @update:modelValue="(...args) => emit('update:modelValue', ...args)">
		<template v-slot:label="binding" v-if="$slots['label']">
			<slot name="label" v-bind="binding" />
		</template>
		<template v-slot:append-inner="binding" v-if="$slots['append-inner']">
			<slot name="append-inner" v-bind="binding" />
		</template>
		<template v-slot:append="binding" v-if="$slots['append']">
			<slot name="append" v-bind="binding" />
		</template>
	</v-select>
</template>
