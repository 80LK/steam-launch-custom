<script setup lang="ts">
import { mdiCog, mdiContentCopy } from "@mdi/js";
import useSettings from '@store/settings';

const settings = useSettings();

function copyPath(path: string) {
	navigator.clipboard.writeText(path);
}
function openPath(path: string) {
	App.openExploret(path);
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
						{{ $t('settings.title') }}
					</v-card-title>
				</v-card-item>
				<v-divider />
				<v-card-text>
					<v-select :label="$t('settings.theme')" :items="settings.theme.available"
						:model-value="settings.theme.current" variant="outlined" density="compact"
						@update:model-value="settings.theme.set" />
					<v-select :label="$t('settings.language')" :items="settings.locale.available"
						:model-value="settings.locale.current" variant="outlined" density="compact"
						@update:model-value="settings.locale.set" />
					<v-switch :label="$t('settings.scan_every_launch')" :model-value="settings.scanGameLaunch.value"
						color="success" @update:model-value="settings.scanGameLaunch.set" />
					<v-text-field readonly :label="$t('settings.appdata')" v-model="settings.appDataPath"
						variant="outlined" density="compact">
						<template v-slot:append-inner>
							<v-icon :icon="mdiContentCopy" @click="copyPath(settings.appDataPath)" />
						</template>
						<template v-slot:append>
							<v-btn height="40px" @click="openPath(settings.appDataPath)" color="success">
								{{ $t('settings.open') }}
							</v-btn>
						</template>
					</v-text-field>

					<v-text-field readonly :label="$t('settings.steam')" v-model="settings.steamPath" variant="outlined"
						density="compact">
						<template v-slot:append-inner>
							<v-icon :icon="mdiContentCopy" @click="copyPath(settings.steamPath)" />
						</template>
						<template v-slot:append>
							<v-btn height="40px" @click="openPath(settings.steamPath)" color="success">
								{{ $t('settings.open') }}
							</v-btn>
						</template>
					</v-text-field>
				</v-card-text>
				<v-divider />
				<v-card-actions>
					<v-btn class="success" @click="isActive.value = false">
						{{ $t('settings.close') }}
					</v-btn>
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
