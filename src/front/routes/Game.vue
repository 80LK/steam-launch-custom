<script setup lang="ts">
import ConfirmRemove from '@components/ConfirmRemove.vue';
import Container, { Done } from '@components/Container.vue';
import GameIcons from '@components/Game/Icons.vue';
import Editor from '@components/Launch/Editor.vue';
import LaunchList from '@components/Launch/List.vue';
import { mdiArrowLeft, mdiClose, mdiPencil, mdiPlay, mdiPlus, mdiTrashCan } from '@mdi/js';
import { ILaunch } from '@shared/Launch';
import useGamesStore from '@store/games';
import useLaunchStore from '@store/launch';
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

const rawGameId = useRoute().params.gameId;
const gameId = parseInt(Array.isArray(rawGameId) ? rawGameId[0] : rawGameId)

const gameStore = useGamesStore();
const game = gameStore.get(gameId);
function gameConfigure() {
	gameStore.configure(game.id);
}
function resetConfigure() {
	gameStore.resetConfigure(game.id);
}

const launchStore = useLaunchStore();
const launchs = ref([] as ILaunch[]);
const hasLaucnhs = computed(() => game.configured && launchs.value.length > 0)

let total = 0;
const limit = 2;
async function loadLaunchs(done: Done) {
	const items = await launchStore.getForGame(game.id, total, limit);
	launchs.value = launchs.value.concat(items);
	total += items.length;
	done(items.length < limit ? 'empty' : 'ok');
}

const editor = useTemplateRef('editor');
const container = useTemplateRef('container');

function relaod() {
	launchs.value = [];
	total = 0;
	container.value?.reset();
}

const removeModel = useTemplateRef('remove');
function delet(launch_id: number) {
	removeModel.value?.open()
		.then(async e => {
			if (!e) return;
			await launchStore.remove(launch_id);
			relaod();
		})
}

</script>

<template>
	<Container padding="0" @load="loadLaunchs" ref="container" :is-infinite-scroll="game.configured">
		<template v-slot:header>
			<v-img v-if="game" :class="['bg-grey-lighten-2', $style.header]" cover :src="game.image">
				<v-toolbar :class="$style.toolbar">
					<v-btn :icon="mdiArrowLeft" variant="text" to="/" />
					<v-toolbar-title>{{ game.name }}</v-toolbar-title>
					<v-spacer />
					<GameIcons :game="game" />
				</v-toolbar>

				<v-btn :prepend-icon="mdiPlay" tile color="success" size="large" :class="$style.play"
					:href="`steam://rungameid/${game.id}`">Launch</v-btn>

				<div v-if="game.configured" :class="$style.add">
					<v-btn :icon="mdiClose" color="error" v-tooltip:start="'Reset configuration'"
						@click="resetConfigure" />
					<v-btn :icon="mdiPlus" color="success" v-tooltip:start="'Add variant launch'"
						@click="editor?.create(game.id)" />
				</div>
			</v-img>
		</template>

		<div v-if="!hasLaucnhs" :class="$style.center">
			<v-btn v-if="!game.configured" tile size="x-large" color="success" @click="gameConfigure">Configure</v-btn>
			<span v-else class="text-h6">No Launchs</span>
		</div>

		<LaunchList v-else :launchs="launchs" detail>
			<template v-slot:append="{ launch }">
				<v-btn :icon="mdiPencil" variant="text" v-tooltip="'Edit launch setting'"
					@click="editor?.edit(launch.id)" />
				<v-btn color="error" :icon="mdiTrashCan" variant="text" v-tooltip="'Remove launch setting'"
					@click="delet(launch.id)" />
			</template>
		</LaunchList>
	</Container>

	<Editor ref="editor" @create="relaod" />
	<ConfirmRemove ref="remove" />
</template>

<style module>
.header {
	height: var(--header-height, 225px);
	overflow: visible;
	z-index: 1;
}

.header .play {
	position: absolute;
	left: 1em;
	bottom: 1em;
}

.header .toolbar {
	background: linear-gradient(180deg, black, transparent);
	color: white;
	padding-right: 1em;
}

.header .add {
	position: absolute;
	display: flex;
	gap: 1em;
	bottom: 1em;
	right: 1em;
}

.center {
	justify-content: center;
	align-items: center;
	display: flex;
	height: calc(100% - 1px);
}
</style>
