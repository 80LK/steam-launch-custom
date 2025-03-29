<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { Variant } from "./Input/Input";

type IconValue = string | (string | [path: string, opacity: number])[];

const { global } = useTheme();
const is_solo = computed(() => global.current.value.variables['input-variant'] as Variant == 'solo');

const { icon, activeColor = 'success', baseColor } = defineProps<{ icon?: IconValue, activeColor?: string, baseColor?: string }>();
const c_baseColor = computed(() => baseColor ?? is_solo.value ? 'none' : 'grey');

const value = defineModel<boolean>({ default: false });

const variant = computed(() => value.value || is_solo.value ? 'flat' : 'outlined');
const color = computed(() => value.value ? activeColor : c_baseColor.value);
</script>

<template>
	<v-btn :prepend-icon="icon" :variant="variant" :color="color" @click="value = !value" border>
		<slot />
	</v-btn>
</template>
