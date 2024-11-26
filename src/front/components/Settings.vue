<script setup lang="ts">
import { useTheme } from 'vuetify';
import { mdiCog } from "@mdi/js";

const theme = useTheme();

const themes = Object.keys(theme.themes.value);
const currentTheme = theme.global.name;
function changeTheme() {
	localStorage.setItem('theme', currentTheme.value);
}
</script>

<template>
	<v-dialog max-width="500">
		<template v-slot:activator="{ props: activatorProps }">
			<v-fab :icon="mdiCog" :class="$style.settings" v-bind="activatorProps" />
		</template>
		<template v-slot:default="{ isActive }">
			<v-card>
				<v-card-item :prepend-icon="mdiCog">
					<v-card-title>
						Settings
					</v-card-title>
				</v-card-item>
				<v-divider />
				<v-card-text>
					<v-select label="Theme" :items="themes" v-model="currentTheme" variant="outlined"
						@update:modelValue="changeTheme" />
					<v-switch label="Scan games every time launch program" color="success" />
				</v-card-text>
				<v-divider />
				<v-card-actions>
					<v-btn class="success" @click="isActive.value = false">Close</v-btn>
				</v-card-actions>
			</v-card>
		</template>
	</v-dialog>
</template>

<style lang="css" module>
:global(.v-fab).settings {
	position: fixed;
	bottom: 35px;
	right: 79px;
}
</style>
