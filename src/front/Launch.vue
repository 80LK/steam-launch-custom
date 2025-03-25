<script setup lang="ts">
import Container, { Done } from '@components/Container.vue';
import Header from '@components/Game/Header.vue';
import Init from '@components/Init.vue'
import { mdiPlay, mdiStop } from '@mdi/js';
import { IGame } from '@shared/Game';
import { ILaunch } from '@shared/Launch';
import useLaunchStore from '@store/launch';
import { ref } from 'vue';
import LaunchList from '@components/Launch/List.vue';
const game = ref(null as IGame | null);
Game.getLaunch().then(e => game.value = e);

const store = useLaunchStore()
const launchs = ref([] as ILaunch[]);
let total = 0;
const limit = 2;
async function loadLaunchs(done: Done) {
	if (!game.value) return;
	if (total == 0) {
		const l = await Launch.getCurrentLaunch();
		if (l) launchs.value.push(l)
	}
	const items = await store.getForGame(game.value.id, total, limit);
	launchs.value = launchs.value.concat(items);
	total += items.length;
	done(items.length < limit ? 'empty' : 'ok');
}


function cancel() {
	SystemBar.close();
}
function start(id: number) {
	Launch.start(id);
}

</script>

<template>
	<v-app id="inspire">
		<v-main scrollable>
			<Init>
				<Container padding="0" @load="loadLaunchs" :is-infinite-scroll="!!game">
					<template v-slot:header v-if="game">
						<Header :game="game" height="170px">
							<v-btn :prepend-icon="mdiStop" tile color="error" size="large" :class="$style.play"
								@click="cancel">
								{{ $t('game.cancel') }}
							</v-btn>
						</Header>
					</template>

					<LaunchList :launchs="launchs" v-if="game">
						<template v-slot:append="{ launch }">
							<v-btn :prepend-icon="mdiPlay" tile color="success" size="large"
								@click="start(launch.id)">{{ $t('game.launch') }}</v-btn>
						</template>
					</LaunchList>
				</Container>
			</Init>
		</v-main>
	</v-app>
</template>

<style module>
.play {
	position: absolute;
	left: 1em;
	bottom: 1em;
}
</style>
