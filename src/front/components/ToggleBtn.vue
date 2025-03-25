<script setup lang="ts">
import { computed } from 'vue';

type IconValue = string | (string | [path: string, opacity: number])[];

const { icon, activeColor = 'success', baseColor = 'grey' } = defineProps<{ icon?: IconValue, activeColor?: string, baseColor?: string }>();

const value = defineModel<boolean>({ default: false });

const variant = computed(() => value.value ? 'flat' : 'outlined');
const color = computed(() => value.value ? activeColor : baseColor);
</script>

<template>
	<v-btn :prepend-icon="icon" :variant="variant" :color="color" @click="value = !value" border>
		<slot />
	</v-btn>
</template>
