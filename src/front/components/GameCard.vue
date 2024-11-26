<script setup lang="ts">
import { mdiCog, mdiDownload, mdiDownloadOff } from '@mdi/js';
import { computed } from 'vue';
import { ConfigureState, GameCardProps } from '../utils/IGame';

const { id, title, downloaded, configured } = defineProps<GameCardProps>();
const downloadedIcon = computed(() => downloaded ? mdiDownload : mdiDownloadOff);
const downloadedColor = computed(() => downloaded ? 'success' : 'grey');
const downloadedTooltip = computed(() => downloaded ? 'Game installed' : 'Game not installed');
const configuredColor = computed(() => {
	if (!downloaded) return 'grey';
	switch (configured) {
		case ConfigureState.YES_NOT_WRITE:
			return 'warning'
		case ConfigureState.YES:
			return 'success'
		default:
		case ConfigureState.NO:
			return 'grey';
	}
})

const configuredTooltip = computed(() => {
	if (!downloaded) return 'Not configured';
	switch (configured) {
		case ConfigureState.YES_NOT_WRITE:
			return 'You need close steam and write configure'
		case ConfigureState.YES:
			return 'Configured'
		default:
		case ConfigureState.NO:
			return 'Not configured';
	}
})
</script>

<template>
	<v-card min-width="225" max-width="250" :to="`/game/${id}`" :disabled="!downloaded">
		<v-img class="bg-grey-lighten-2" cover height="125"
			:src="`file:///C:/Users/80lkr/Pictures/volk s arbuzom.png`" />
		<v-card-actions>
			<h6 class="text-h6">
				{{ title }}
			</h6>
			<v-spacer />
			<v-icon :icon="downloadedIcon" :color="downloadedColor" v-tooltip="downloadedTooltip" />
			<v-icon v-if="downloaded" :icon="mdiCog" :color="configuredColor" v-tooltip="configuredTooltip" />
		</v-card-actions>
	</v-card>
</template>
