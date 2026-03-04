<script setup lang="ts">
import { mdiDownload, mdiDownloadOff, mdiStar, mdiStarOutline } from '@mdi/js';
import { IGame } from "@shared/Game";
import useGamesStore from '@store/games';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { game } = defineProps<{ game: IGame }>()
const store = useGamesStore();
const { t } = useI18n();

const installedIcon = computed(() => game.installed ? mdiDownload : mdiDownloadOff);
const installedColor = computed(() => game.installed ? 'success' : 'grey');
const installedTooltip = computed(() => t(game.installed ? 'game.installed' : 'game.not_installed'));

const isFavoriteIcon = computed(() => game.stared ? mdiStar : mdiStarOutline);
const isFavoriteColor = computed(() => game.stared ? 'yellow' : 'grey');

function star(event: PointerEvent) {
	event.stopPropagation();
	store.stared(game.id, !game.stared);
}
</script>

<template>
	<div>
		<v-icon :icon="installedIcon" :color="installedColor" v-tooltip="installedTooltip" />
		<v-icon :icon="isFavoriteIcon" :color="isFavoriteColor" v-tooltip="$t('game.favourites')" @click="star" />
	</div>
</template>
