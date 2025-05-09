<script setup lang="ts">
import { mdiCog, mdiContentCopy } from "@mdi/js";
import useSettings from '@store/settings';
import TextField from '@components/Input/TextField.vue';
import Select from '@components/Input/Select.vue';
import Switch from '@components/Input/Switch.vue';
import { ref } from "vue";
import useConfigure from "@store/configure";

const settings = useSettings();
const configure = useConfigure();

const appDataPath = ref('');
const steamPath = ref('');
App.getAppData().then(value => appDataPath.value = value);
Steam.getPath().then(value => steamPath.value = value);
// Configure.canUseAppInfo().then(value => canUseAppInfo.value = value)
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
					<Select :label="$t('settings.theme')" :items="settings.theme.available"
						:model-value="settings.theme.current" @update:model-value="settings.theme.set" force-label />

					<Select :label="$t('settings.language')" :items="settings.locale.available"
						:model-value="settings.locale.current" @update:model-value="settings.locale.set" force-label
						hide-details />

					<Switch :label="$t('settings.scan_every_launch')" :model-value="settings.scanGameLaunch.value"
						color="primary" @update:model-value="settings.scanGameLaunch.set" hide-details />

					<Switch :label="$t('settings.use_appinfo')" color="primary" hide-details
						:model-value="configure.useAppInfo" @update:model-value="configure.setUseAppInfo"
						v-tooltip:bottom-start="$t('settings.use_appinfo_tooltip')" v-if="configure.canUseAppInfo" />

					<Switch :label="$t('settings.check_prerelease')" :model-value="settings.checkPreRelease.value"
						color="primary" @update:model-value="settings.checkPreRelease.set" />

					<TextField readonly :label="$t('settings.appdata')" v-model="appDataPath" forceLabel>
						<template v-slot:append-inner>
							<v-icon :icon="mdiContentCopy" @click="copyPath(appDataPath)" />
						</template>
						<template v-slot:append>
							<v-btn height="40px" @click="openPath(appDataPath)" color="primary">
								{{ $t('settings.open') }}
							</v-btn>
						</template>
					</TextField>

					<TextField readonly :label="$t('settings.steam')" v-model="steamPath" forceLabel>
						<template v-slot:append-inner>
							<v-icon :icon="mdiContentCopy" @click="copyPath(steamPath)" />
						</template>
						<template v-slot:append>
							<v-btn height="40px" @click="openPath(steamPath)" color="primary">
								{{ $t('settings.open') }}
							</v-btn>
						</template>
					</TextField>
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
