<script setup lang="ts">
import { mdiCog, mdiDownload, mdiDownloadOff, mdiStar, mdiStarOutline } from '@mdi/js';
import { IGame } from "@shared/Game";
import useConfigure from '@store/configure';
import useGamesStore from '@store/games';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { game } = defineProps<{ game: IGame }>()
const store = useGamesStore();
const configure = useConfigure()
const { t } = useI18n();

const installedIcon = computed(() => game.installed ? mdiDownload : mdiDownloadOff);
const installedColor = computed(() => game.installed ? 'success' : 'grey');
const installedTooltip = computed(() => t(game.installed ? 'game.installed' : 'game.not_installed'));

const configuredColor = computed(() => {
	if (!game.installed) return 'grey';
	if (game.needWrite) return 'warning'
	return game.configured ? 'success' : 'grey';
})
const configuredTooltip = computed(() => {
	if (!game.installed) return t('game.not_configured');
	if (game.needWrite) return t('game.need_write');
	return t(game.configured ? 'game.configured' : 'game.not_configured');
})

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
		<v-icon :icon="mdiCog" :color="configuredColor" v-tooltip="configuredTooltip" v-if="!configure.useAppInfo" />
		<v-icon :icon="isFavoriteIcon" :color="isFavoriteColor" v-tooltip="$t('game.favourites')" @click="star" />
	</div>
</template>
