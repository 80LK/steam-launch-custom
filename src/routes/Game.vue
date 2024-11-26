<script setup lang="ts">
import { mdiArrowLeft, mdiPencil, mdiPlus, mdiTrashCan, mdiPlay } from '@mdi/js';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { ConfigureState } from '../utils/IGame';
const c = 12;
const dialog = ref(false);
const dialog2 = ref(false);
const route = useRoute();
const rawGameId = route.params.gameId;
const gameId = parseInt(Array.isArray(rawGameId) ? rawGameId[0] : rawGameId);
const state = ref(gameId % 3 as ConfigureState);

</script>

<template>
	<v-img :class="['bg-grey-lighten-2', $style.header]" cover
		:src="`file:///C:/Users/80lkr/Pictures/volk s arbuzom.png`">
		<v-toolbar :class="$style.toolbar">
			<v-btn :icon="mdiArrowLeft" variant="text" to="/" />
			<v-toolbar-title>Game {{ gameId }}</v-toolbar-title>
		</v-toolbar>

		<!-- href="steam://rungameid/730" -->
		<v-btn :prepend-icon="mdiPlay" tile color="success" size="large" :class="$style.play">Launch</v-btn>

		<v-btn :icon="mdiPlus" color="success" :class="$style.add" @click="dialog = true"
			v-tooltip:start="'Add variant launch'" v-if="state !== ConfigureState.NO" />
	</v-img>
	<v-container fluid :class="$style.main">
		<v-btn v-if="state == ConfigureState.NO" tile size="x-large" :class="$style.configure" color="success"
			@click="state = ConfigureState.YES_NOT_WRITE">Configure</v-btn>
		<v-row v-else>
			<v-col cols="12">
				<v-list lines="two" density="compact">
					<v-list-item v-for="i in c" :key="i">
						<template v-slot:prepend>
							<v-avatar image="file:///C:/Users/80lkr/Pictures/volk s arbuzom.png" />
						</template>
						<v-list-item-title>
							Title
						</v-list-item-title>
						<v-list-item-subtitle>
							Execute file
							<template v-if="i % 3 == 1">
								<v-divider />
								Launch options
							</template>
						</v-list-item-subtitle>
						<template v-slot:append>
							<v-btn :icon="mdiPencil" variant="text" v-tooltip="'Edit launch setting'"
								@click="dialog = true"></v-btn>
							<v-btn color="error" :icon="mdiTrashCan" v-tooltip="'Remove launch setting'"
								@click="dialog2 = true" variant="text"></v-btn>
						</template>
					</v-list-item>
				</v-list>
			</v-col>
		</v-row>
	</v-container>

	<v-dialog v-model="dialog" persistent max-width="500">
		<v-card>
			<v-card-item :prepend-icon="mdiPencil">
				<v-card-title>
					Edit laucnh "Title"
				</v-card-title>
			</v-card-item>
			<v-divider />
			<v-card-text>
				<v-text-field label="Title" variant="outlined" />
				<v-text-field label="Executable file" variant="outlined" />
				<v-text-field label="Launch options" variant="outlined" />
				<v-text-field label="Work Directory" variant="outlined" />
			</v-card-text>
			<v-divider />
			<v-card-actions>
				<v-btn color="success" @click="dialog = false">Save</v-btn>
				<v-btn color="error" @click="dialog = false">Cancel</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog v-model="dialog2" persistent max-width="500">
		<v-card>
			<v-card-item :prepend-icon="mdiTrashCan">
				<v-card-title>
					Confirm remove launch "Title"
				</v-card-title>
			</v-card-item>
			<v-divider />
			<v-card-actions>
				<v-btn color="error" @click="dialog2 = false">Yes</v-btn>
				<v-btn color="success" @click="dialog2 = false">No</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
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

.main .configure {
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
