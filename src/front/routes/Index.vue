<script setup lang="ts">
import { mdiCached, mdiMagnify } from "@mdi/js";
import Container from "../components/FlexGrid.vue"
import GameCard from "../components/GameCard.vue";
import { computed, ref } from "vue";
import IGame from "../../IGame";

const loading = ref(true);
const needWrite = ref(false);
const canScan = ref(true);
const search = ref(null as string | null);
const all_games = ref([] as IGame[]);

const games = computed(() => all_games.value.filter(e => search.value ? e.name.toLowerCase().includes(search.value.toLowerCase()) : true))

Config.get().then(e => canScan.value = !e.scanGameLaunch)
Game.needWrite().then(e => needWrite.value = e);

async function getGames() {
	loading.value = true;
	all_games.value = await Game.getAll();
	loading.value = false;
}

async function scanGame() {
	loading.value = true;
	await Steam.scanGames()
	await getGames();
	loading.value = false;
}

getGames();
</script>

<template>
	<v-container fluid>
		<v-row v-if="needWrite">
			<v-col cols="12">
				<v-alert type="warning" variant="tonal" border="start">
					<div style="display: flex; align-items: center; justify-content: space-between">
						You need close Steam and rewrite launch option
						<v-btn color="warning">Now</v-btn>
					</div>
				</v-alert>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12">
				<v-text-field label="Search" clearable variant="outlined" hide-details="auto" v-model="search">
					<template v-slot:label="{ label }">
						<v-icon :icon="mdiMagnify" /> {{ label }}
					</template>
					<template v-slot:append v-if="canScan">
						<v-btn size="x-large" color="green" :prepend-icon="mdiCached" @click="scanGame()">Scan
							game</v-btn>
					</template>
				</v-text-field>

			</v-col>
			<v-col cols="12">
				<Container padding="0" :loading="loading">
					<GameCard v-for="i in games" :key="i.id" :game="i" />
				</Container>
			</v-col>
		</v-row>
	</v-container>
</template>
