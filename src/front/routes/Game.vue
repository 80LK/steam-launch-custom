<script setup lang="ts">
import ConfirmRemove from '@components/ConfirmRemove.vue';
import Container, { Done } from '@components/Container.vue';
import GameIcons from '@components/Game/Icons.vue';
import Header from '@components/Game/Header.vue';
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
	removeModel.value?.open('launch')
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
			<Header :game="game">
				<template v-slot:toolbar-prepare>
					<v-btn :icon="mdiArrowLeft" variant="text" to="/" />
				</template>
				<template v-slot:toolbar-append>
					<GameIcons :game="game" :class="$style.icons" />
				</template>

				<v-btn :prepend-icon="mdiPlay" tile color="success" size="large" :class="$style.play"
					:href="`steam://rungameid/${game.id}`" v-if="game.installed">
					{{ $t('game.launch') }}
				</v-btn>

				<div v-if="game.configured" :class="$style.add">
					<v-btn :icon="mdiClose" color="error" v-tooltip:start="$t('game.reset_configure')"
						@click="resetConfigure" />
					<v-btn :icon="mdiPlus" color="success" v-tooltip:start="$t('game.add_launch')"
						@click="editor?.create(game.id)" />
				</div>

			</Header>
		</template>

		<div v-if="!hasLaucnhs" :class="$style.center">
			<v-btn v-if="!game.configured" tile size="x-large" color="success" @click="gameConfigure">
				{{ $t('game.configure') }}
			</v-btn>
			<span v-else class="text-h6">
				{{ $t('game.not_have_launchs') }}
			</span>
		</div>

		<LaunchList v-else :launchs="launchs" detail>
			<template v-slot:append="{ launch }">
				<v-btn :icon="mdiPencil" variant="text" v-tooltip="$t('game.edit_launch')"
					@click="editor?.edit(launch.id)" />
				<v-btn color="error" :icon="mdiTrashCan" variant="text" v-tooltip="$t('game.remove_launch')"
					@click="delet(launch.id)" />
			</template>
		</LaunchList>
	</Container>

	<Editor ref="editor" @create="relaod" />
	<ConfirmRemove ref="remove" />
</template>

<style module>
.play {
	position: absolute;
	left: 1em;
	bottom: 1em;
}

.add {
	position: absolute;
	display: flex;
	gap: 1em;
	bottom: 1em;
	right: 1em;
}

.icons {
	padding-right: 1em;

}

.center {
	justify-content: center;
	align-items: center;
	display: flex;
	height: calc(100% - 1px);
}
</style>
