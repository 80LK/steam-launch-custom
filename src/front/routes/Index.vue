<script setup lang="ts">
import { mdiCached, mdiMagnify } from "@mdi/js";
import Container from "../components/FlexGrid.vue"
import GameCard from "../components/GameCard.vue";
import { onMounted, ref, useTemplateRef } from "vue";
import Updater from '../components/Updater.vue';
import IGame from "../../IGame";
import InfiniteScroll, { Done } from "../components/InfiniteScroll.vue";

const needWrite = ref(false);
const canScan = ref(true);
const search = ref(null as string | null);
const games = ref([] as IGame[]);
const scroll = useTemplateRef('scroll');

Config.get().then(e => canScan.value = !e.scanGameLaunch)

async function checkNeedWrite() {
	const need = await Game.needWrite();
	needWrite.value = need;
}

let total = 0;
const limit = 12;

function resetGames() {
	games.value = [];
	scroll.value?.reset()
	total = 0;
}

const isReady = ref(true);
let onReady = () => { };
function resetReady() {
	isReady.value = false;
	resetGames();
}
function setReady() {
	isReady.value = true;
	onReady();
}
function readyForLoading(): Promise<void> {
	if (isReady.value) return Promise.resolve();
	return new Promise(r => onReady = () => r())
}

async function scanGame() {
	resetReady();
	await Steam.scanGames()
	setReady();
}

async function writeConfig() {
	resetReady();
	await Game.writeConfig()
	setReady();
	await checkNeedWrite();
}

function searching() {
	resetGames();
	scroll.value?.reset()
}


async function loadGames(done: Done) {
	await readyForLoading();
	const items = await Game.getAll(limit, total, search.value || undefined);
	games.value = games.value.concat(items);
	total += items.length;

	if (items.length < limit) {
		console.log("stop load: empty")
		done('empty');
	} else {
		console.log("stop load: ok")
		done('ok')
	}
}
checkNeedWrite();

onMounted(() => {
	console.log("scroll", scroll);
})
</script>

<template>
	<div :class="$style.index">
		<Updater :class="$style.update" />

		<v-alert :class="$style.config" type="warning" variant="tonal" border="start" v-if="needWrite">
			<div style="display: flex; align-items: center; justify-content: space-between">
				You need close Steam and rewrite launch option
				<v-btn color="warning" @click="writeConfig()" v-if="isReady">Now</v-btn>
			</div>
		</v-alert>

		<v-text-field :class="$style.search" label="Search" clearable variant="outlined" hide-details="auto"
			v-model="search" @update:modelValue="searching">
			<template v-slot:label="{ label }">
				<v-icon :icon="mdiMagnify" /> {{ label }}
			</template>
			<template v-slot:append v-if="canScan && isReady">
				<v-btn size="x-large" color="green" :prepend-icon="mdiCached" @click="scanGame()">Scan
					game</v-btn>
			</template>
		</v-text-field>

		<!-- <v-infinite-scroll :onLoad="loadGames" :class="$style.games">
			<Container gap="1em" padding="0 1em">
				<GameCard v-for="i in games" :key="i.id" :game="i" />
			</Container>
			<template v-slot:empty></template>
		</v-infinite-scroll> -->

		<InfiniteScroll ref="scroll" :class="$style.games" @load="loadGames">
			<Container gap="1em" padding="0 1em">
				<GameCard v-for="i in games" :key="i.id" :game="i" />
			</Container>
		</InfiniteScroll>
	</div>
	<!-- <v-container fluid>
		<v-row v-if="needWrite">
			<v-col cols="12">
				<v-alert type="warning" variant="tonal" border="start">
					<div style="display: flex; align-items: center; justify-content: space-between">
						You need close Steam and rewrite launch option
						<v-btn color="warning" @click="writeConfig()">Now</v-btn>
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
	</v-container> -->
</template>

<style module>
.index {
	height: 100%;
	display: grid;
	grid-template-areas: "update" "config" "search" "games";
	grid-template-rows: max-content max-content max-content auto;
	gap: 1em;
	padding-top: 1em;
}

.update,
.config,
.search {
	margin-left: 1em;
	margin-right: 1em;
}

.update {
	grid-area: update;
}

.config {
	grid-area: config;
}

.search {
	grid-area: search;
}

.games {
	grid-area: games;
}
</style>
