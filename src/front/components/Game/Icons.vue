<script setup lang="ts">
import { mdiCog, mdiDownload, mdiDownloadOff, mdiStar, mdiStarOutline } from '@mdi/js';
import { IGame } from "@shared/Game";
import useGamesStore from '@store/games';
import { computed } from 'vue';
const { game } = defineProps<{ game: IGame }>()
const store = useGamesStore();

const installedIcon = computed(() => game.installed ? mdiDownload : mdiDownloadOff);
const installedColor = computed(() => game.installed ? 'success' : 'grey');
const installedTooltip = computed(() => game.installed ? 'Game installed' : 'Game not installed');

const configuredColor = computed(() => {
	if (!game.installed) return 'grey';
	if (game.needWrite) return 'warning'
	return game.configured ? 'success' : 'grey';
})
const configuredTooltip = computed(() => {
	if (!game.installed) return 'Not configured';
	if (game.needWrite) return 'You need close steam and write configure';
	return game.configured ? 'Configured' : 'Not configured';
})

const isFavoriteIcon = computed(() => game.stared ? mdiStar : mdiStarOutline);
const isFavoriteColor = computed(() => game.stared ? 'yellow' : 'grey');

function star(event: PointerEvent) {
	event.stopPropagation();
	store.stared(game.id, !game.stared);
}
</script>

<template>
	<v-icon :icon="installedIcon" :color="installedColor" v-tooltip="installedTooltip" />
	<v-icon :icon="mdiCog" :color="configuredColor" v-tooltip="configuredTooltip" />
	<v-icon :icon="isFavoriteIcon" :color="isFavoriteColor" v-tooltip="'Favourites'" @click="star" />
</template>
