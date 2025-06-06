<script setup lang="ts">
import { mdiMagnify, mdiDownload, mdiStar, mdiCog } from "@mdi/js";
import ToggleBtn from "@components/ToggleBtn.vue";
import Updater from '@components/Updater.vue';
import NeedConfigure from '@components/Game/NeedConfigure.vue';
import Container, { Done } from '@components/Container.vue';
import GameCard from "@components/Game/Card.vue";
import TextField from "@components/Input/TextField.vue";
import { ref, useTemplateRef } from "vue";
import useGamesStore from "@store/games";
import useConfigure from "@store/configure";

const store = useGamesStore();
const configure = useConfigure();

const search = ref(null as string | null);
const filterInstalled = ref(false);
const filterFavourites = ref(false);
const filterConfigured = ref(false);

const container = useTemplateRef('container');
const limit = 12;

async function loadGames(done: Done) {
	await scaned();
	const loaded = await store.load(limit, {
		search: search.value,
		stared: filterFavourites.value,
		installed: filterInstalled.value,
		configured: filterConfigured.value
	});
	done(loaded < limit ? 'empty' : 'ok');
}

function resetGames() {
	container.value?.reset();
	store.reset();
}

function searching() {
	resetGames();
}


let isScaning = false;
let onScaned = () => { };

function scaned() {
	if (!isScaning) return Promise.resolve();

	return new Promise<void>(resolve => {
		onScaned = resolve;
	})
}
</script>

<template>
	<Container @load="loadGames" ref="container" is-infinite-scroll>
		<template v-slot:header>
			<Updater class="mb-4" />

			<NeedConfigure class="mb-4" />

			<TextField :label="$t('main.search')" clearable hide-details="auto" v-model="search"
				@update:modelValue="searching" class="mb-4" :prepend-inner-icon="mdiMagnify" />

			<div :class="$style.filterPanel">
				<ToggleBtn :icon="mdiDownload" v-model="filterInstalled" @update:model-value="searching">
					{{ $t('main.installed') }}
				</ToggleBtn>
				<ToggleBtn :icon="mdiStar" v-model="filterFavourites" @update:model-value="searching"
					active-color="#c16100">
					{{ $t('main.favourites') }}
				</ToggleBtn>
				<ToggleBtn :icon="mdiCog" v-model="filterConfigured" @update:model-value="searching"
					v-if="!configure.useAppInfo">
					{{ $t('main.configured') }}
				</ToggleBtn>
			</div>
		</template>

		<div :class="$style.grid">
			<GameCard v-for="i in store.feed" :game="i" :key="i.id" />
		</div>
	</Container>
</template>

<style module>
.grid {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	gap: 16px;
}

.filterPanel {
	display: flex;
	gap: 16px;
	justify-content: center;
}
</style>
