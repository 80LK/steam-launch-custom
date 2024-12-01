<script setup lang="ts">
import { mdiCog, mdiDownload, mdiDownloadOff } from '@mdi/js';
import { computed, ref } from 'vue';
import IGame, { GameState } from '../../IGame';
const steamPath = ref("");
Config.get().then(e => steamPath.value = e.steamPath)

const { game } = defineProps<{ game: IGame }>();
const installed = computed(() => game.state & GameState.INSTALLED);
const installedIcon = computed(() => installed.value ? mdiDownload : mdiDownloadOff);
const installedColor = computed(() => installed.value ? 'success' : 'grey');
const installedTooltip = computed(() => installed.value ? 'Game installed' : 'Game not installed');

const configured = computed(() => game.state & GameState.CONFIGURED);
const configuredColor = computed(() => {
	if (!installed.value || !configured.value) return 'grey';
	if (game.state & GameState.NEED_WRITE) return 'warning'
	return 'success'
})

const configuredTooltip = computed(() => {
	if (!installed.value || !configured.value) return 'Not configured';
	if (game.state & GameState.NEED_WRITE) return 'You need close steam and write configure';

	return 'Configured';
})
</script>

<template>
	<v-card min-width="225" max-width="250" :to="`/game/${game.id}`" :disabled="!installed">
		<v-img class="bg-grey-lighten-2" cover height="125" :src="game.image" />
		<v-card-actions>
			<h6 :class="[$style.title, 'text-h6']">
				{{ game.name }}
			</h6>
			<v-spacer />
			<v-icon :icon="installedIcon" :color="installedColor" v-tooltip="installedTooltip" />
			<v-icon v-if="installed" :icon="mdiCog" :color="configuredColor" v-tooltip="configuredTooltip" />
		</v-card-actions>
	</v-card>
</template>

<style module>
.title {
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}
</style>
