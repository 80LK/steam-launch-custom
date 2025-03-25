<script setup lang="ts">
import { mdiCached, mdiMagnify, mdiDownload, mdiStar, mdiCog } from "@mdi/js";
import ToggleBtn from "@components/ToggleBtn.vue";
import Updater from '@components/Updater.vue';
import NeedConfigure from '@components/Game/NeedConfigure.vue';
import Container, { Done } from '@components/Container.vue';
import GameCard from "@components/Game/Card.vue";
import { ref, useTemplateRef } from "vue";
import { IGame } from "@shared/Game";
import useGamesStore from "@store/games";

const store = useGamesStore();
const games = ref([] as IGame[]);

const search = ref(null as string | null);
const filterInstalled = ref(false);
const filterFavourites = ref(false);
const filterConfigured = ref(false);

const container = useTemplateRef('container');
let total = 0;
const limit = 12;

async function loadGames(done: Done) {
	await scaned();
	const items = await store.getAll(total, limit, search.value, {
		stared: filterFavourites.value,
		installed: filterInstalled.value,
		configured: filterConfigured.value
	});
	games.value = games.value.concat(items);
	total += items.length;
	done(items.length < limit ? 'empty' : 'ok');
}

function resetGames() {
	games.value = [];
	total = 0;
	container.value?.reset();
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
async function scan() {
	isScaning = true;
	resetGames();
	await Game.scan();
	isScaning = false;
	onScaned();
}
</script>

<template>
	<Container @load="loadGames" ref="container" is-infinite-scroll>
		<template v-slot:header>
			<Updater class="mb-4" />

			<NeedConfigure class="mb-4" />

			<v-text-field :label="$t('main.search')" clearable variant="outlined" hide-details="auto" v-model="search"
				@update:modelValue="searching" density="compact" class="mb-4">
				<template v-slot:label="{ label }">
					<v-icon :icon="mdiMagnify" /> {{ label }}
				</template>

				<template v-slot:append>
					<v-btn height="40px" color="green" :prepend-icon="mdiCached" @click="scan">
						{{ $t('main.scan') }}
					</v-btn>
				</template>
			</v-text-field>

			<div :class="$style.filterPanel">
				<ToggleBtn :icon="mdiDownload" v-model="filterInstalled" @update:model-value="searching">
					{{ $t('main.installed') }}
				</ToggleBtn>
				<ToggleBtn :icon="mdiStar" v-model="filterFavourites" @update:model-value="searching"
					active-color="#c16100">
					{{ $t('main.favourites') }}
				</ToggleBtn>
				<ToggleBtn :icon="mdiCog" v-model="filterConfigured" @update:model-value="searching">
					{{ $t('main.configured') }}
				</ToggleBtn>
			</div>
		</template>

		<div :class="$style.grid">
			<GameCard v-for="i in games" :game="i" :key="i.id" />
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
