<script setup lang="ts">
import { mdiPlay, mdiStop } from '@mdi/js';
import Setup from './components/Setup.vue';
import IGame from '../IGame';
import { ref } from 'vue';
import ILaunch from '../ILaunch';
const game = ref(null as IGame | null);
const launchs = ref([] as ILaunch[]);
Game.get(LaunchWindow.gameId).then(async e => {
	if (!e) return startCurrent();
	game.value = e;
	launchs.value = await Launch.getAll(e.id);
})

function cancel() {
	SystemBar.close();
}

function startCurrent() {
	LaunchWindow.start();
}
function start(launchId: number) {
	LaunchWindow.start(launchId);
}
</script>

<template>
	<v-app id="inspire">
		<v-main scrollable>
			<Setup>
				<div v-if="!game"></div>
				<template v-else>
					<v-img :class="['bg-grey-lighten-2', $style.header]" cover :src="game.image">
						<v-toolbar :class="$style.toolbar">
							<v-toolbar-title class="ma-0">{{ game.name }}</v-toolbar-title>
						</v-toolbar>

						<v-btn :prepend-icon="mdiStop" tile color="error" size="large" :class="$style.play"
							@click="cancel()">Cancel</v-btn>
					</v-img>
					<v-container fluid :class="$style.main">
						<v-card tile>
							<v-card-item>
								<template v-slot:prepend>
									<v-avatar image="slc-image://currentLaunch" />
								</template>
								<v-card-title>
									{{ game.name }}
								</v-card-title>
								<template v-slot:append>
									<v-btn :prepend-icon="mdiPlay" tile color="success" size="large"
										@click="startCurrent()">Launch</v-btn>
								</template>
							</v-card-item>
							<template v-for="launch in launchs" :key="launch.id">
								<v-divider />
								<v-card-item>
									<template v-slot:prepend>
										<v-avatar :image="launch.image" />
									</template>
									<v-card-title>
										{{ launch.name }}
									</v-card-title>
									<template v-slot:append>
										<v-btn :prepend-icon="mdiPlay" tile color="success" size="large"
											@click="start(launch.id)">Launch</v-btn>
									</template>
								</v-card-item>
							</template>
						</v-card>
					</v-container>
				</template>
			</Setup>
		</v-main>
	</v-app>
</template>

<style lang="css" module>
.header {
	position: fixed;
	z-index: 1;
	width: 100%;
	height: var(--header-height, 170px);
	overflow: visible;
}

.header .toolbar {
	background: linear-gradient(180deg, black, transparent);
	color: white;
	text-align: center;
}

.header .play {
	position: absolute;
	right: 1em;
	bottom: 1em;
}

.main {
	overflow-y: auto;
	margin-top: var(--header-height, 170px);
	height: calc(100% - var(--header-height, 170px));
	padding: 0;
}
</style>
