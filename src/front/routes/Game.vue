<script setup lang="ts">
import { mdiArrowLeft, mdiPencil, mdiPlus, mdiTrashCan, mdiPlay } from '@mdi/js';
import { computed, ref, toRaw } from 'vue';
import { useRoute } from 'vue-router';
import IGame, { GameState } from '../../IGame';
import ILaunch, { INIT_LAUNCH } from '../../ILaunch';
import EditorLaunch from '../components/EditorLaunch.vue';
import ConfirmRemove from '../components/ConfirmRemove.vue';
const rawGameId = useRoute().params.gameId;
const gameId = parseInt(Array.isArray(rawGameId) ? rawGameId[0] : rawGameId);

const game = ref(null as IGame | null)
Game.get(gameId).then(e => {
	game.value = e ?? null;
	getLaunchs();
});
const configured = computed(() => game.value && game.value.state & GameState.CONFIGURED);

const configuring = ref(false);
function configure() {
	configuring.value = true;
	Game.configure(gameId).then(e => {
		game.value = e ?? null;
		configuring.value = false;
		getLaunchs();
	})
}

// Read Launches
const launchs = ref([] as ILaunch[]);
async function getLaunchs() {
	if (!game.value) return;
	launchs.value = await Launch.getAll(game.value.id);
}

// Create/Update Launches 
const editableLaunch = ref<ILaunch>();
const edit = ref<boolean>(false);
function editLaunch(launch: ILaunch) {
	edit.value = true;
	editableLaunch.value = launch;
}
function newLaunch() {
	if (!game.value) return;
	edit.value = false;
	editableLaunch.value = INIT_LAUNCH(game.value.id);
}
async function save(launch: ILaunch, isEdit: boolean) {
	if (isEdit) {
		Object.assign(launchs.value.find(e => e.id == launch.id) || {}, await Launch.edit(launch));
	} else {
		const new_launch = await Launch.create(launch);
		launchs.value.push(new_launch);
	}
}

// Delete Launches
const removingLaunch = ref(false);
const removableLaunch = ref<ILaunch>();
function startRemove(launch: ILaunch) {
	removingLaunch.value = true;
	removableLaunch.value = launch;
}
async function endRemove() {
	const launch = toRaw(removableLaunch.value);
	if (!launch || !removableLaunch.value) return;

	await Launch.remove(launch.game_id, launch.id);
	launchs.value = launchs.value.filter(e => e != removableLaunch.value)
}
</script>

<template>
	<v-img v-if="game" :class="['bg-grey-lighten-2', $style.header]" cover :src="`file:///${game.image}`">
		<v-toolbar :class="$style.toolbar">
			<v-btn :icon="mdiArrowLeft" variant="text" to="/" />
			<v-toolbar-title>{{ game.name }}</v-toolbar-title>
		</v-toolbar>

		<v-btn :prepend-icon="mdiPlay" tile color="success" size="large" :class="$style.play"
			:href="`steam://rungameid/${game.id}`">Launch</v-btn>

		<v-btn :icon="mdiPlus" color="success" :class="$style.add" @click="newLaunch()"
			v-tooltip:start="'Add variant launch'" v-if="configured" />
	</v-img>
	<v-container fluid :class="[$style.main, { [$style.loading]: !game, [$style.configure]: !game || !configured }]">
		<v-progress-circular indeterminate :size="110" :width="10" v-if="!game" />
		<v-btn v-else-if="!configured" tile size="x-large" color="success" :loading="configuring"
			@click="configure()">Configure</v-btn>
		<v-sheet v-else-if="launchs.length == 0" class="align-center d-flex justify-center text-h6 h-100">
			No Launchs
		</v-sheet>
		<v-row v-else>
			<v-col cols="12">
				<v-list lines="two" density="compact">
					<v-list-item v-for="launch in launchs" :key="launch.id">
						<template v-slot:prepend>
							<v-avatar :image="`file:///${launch.image}`" />
						</template>
						<v-list-item-title>
							{{ launch.name }}
						</v-list-item-title>
						<v-list-item-subtitle>
							{{ launch.execute }}
							<template v-if="launch.launch">
								<v-divider />
								{{ launch.launch }}
							</template>
						</v-list-item-subtitle>
						<template v-slot:append>
							<v-btn :icon="mdiPencil" variant="text" v-tooltip="'Edit launch setting'"
								@click="editLaunch(launch)"></v-btn>
							<v-btn color="error" :icon="mdiTrashCan" v-tooltip="'Remove launch setting'"
								@click="startRemove(launch)" variant="text"></v-btn>
						</template>
					</v-list-item>
				</v-list>
			</v-col>
		</v-row>
	</v-container>

	<EditorLaunch v-model="editableLaunch" :edit="edit" @submit="save" />
	<ConfirmRemove v-model="removingLaunch" @submit="endRemove()" thing="launch" />
</template>

<style module>
.header {
	position: fixed;
	z-index: 1;
	width: 100%;
	height: var(--header-height, 225px);
	overflow: visible;
}

.header .toolbar {
	background: linear-gradient(180deg, black, transparent);
	color: white;
}

.header .play {
	position: absolute;
	left: 1em;
	bottom: 1em;
}

.header .add {
	position: absolute;
	bottom: -24px;
	right: 24px;
}

.main {
	overflow-y: auto;
	margin-top: var(--header-height, 225px);
	height: calc(100% - var(--header-height, 225px));
}

.main.loading {
	margin-top: 0;
	height: 100%;
}

.main.configure {
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
