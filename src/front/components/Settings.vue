<script setup lang="ts">
import { useTheme } from 'vuetify';
import { mdiCog, mdiContentCopy } from "@mdi/js";
import { ref } from 'vue';
import { setDark } from '@store/isDark';
import { SCAN_GAME_IN_LAUNCH_KEY } from '@shared/Game';

const theme = useTheme();

const themes = Object.keys(theme.themes.value);
const currentTheme = theme.global.name;
function changeTheme() {
	setDark(currentTheme.value == "dark")
}


const scanGameLaunch = ref(false);
Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false).then(v => scanGameLaunch.value = v);
function edit(field: string, value: any) {
	switch (typeof value) {
		case "boolean":
			Settings.setBoolean(field, value);
			break;

		case "number":
			Settings.setNumber(field, value);
			break;

		case "string":
			Settings.set(field, value);
			break;

		default:
			Settings.set(field, value.toString());
			break;
	}
}

const appDataPath = ref('');
App.getAppData().then(value => appDataPath.value = value)
function copyAppDataPath() {
	navigator.clipboard.writeText(appDataPath.value);
}
function openAppDataPath() {
	App.openExploret(appDataPath.value);
}
</script>

<template>
	<v-dialog max-width="500">
		<template v-slot:activator="{ props: activatorProps }">
			<v-fab :icon="mdiCog" :class="$style.settings" v-bind="activatorProps" location="right" absolute offset />
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
					<v-select label="Theme" :items="themes" v-model="currentTheme" variant="outlined" density="compact"
						@update:modelValue="changeTheme" />
					<v-switch label="Scan games every time launch program" v-model="scanGameLaunch" color="success"
						@update:model-value="edit(SCAN_GAME_IN_LAUNCH_KEY, scanGameLaunch)" />
					<v-text-field readonly label="AppData" v-model="appDataPath" variant="outlined" density="compact">
						<template v-slot:append-inner>
							<v-icon :icon="mdiContentCopy" @click="copyAppDataPath" />
						</template>
						<template v-slot:append>
							<v-btn height="40px" @click="openAppDataPath" color="success">
								Open
							</v-btn>
						</template>
					</v-text-field>
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
	z-index: 1005;
	right: 16px;
}
</style>
