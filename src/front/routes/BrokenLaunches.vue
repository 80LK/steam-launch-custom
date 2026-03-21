<script setup lang="ts">
import Container from '@components/Container.vue';
import ConfirmRemove from '@components/ConfirmRemove.vue';
import Editor from '@components/Launch/Editor.vue';
import List from '@components/Launch/List.vue';
import { mdiArrowLeft, mdiPencil, mdiTrashCan } from "@mdi/js";
import { ILaunch } from '@shared/Launch';
import useLaunchStore from '@store/launch';
import { ref, useTemplateRef } from 'vue';
import useBrokenLaunches from '@store/brokenLaunches';

const brokenLaunches = useBrokenLaunches();
const editor = useTemplateRef('editor');
const removeModel = useTemplateRef('remove');


function create(launch: ILaunch) {
	console.log("Create emit", launch)
	brokenLaunches.fix(launch)
}

function delet(launch: ILaunch) {
	removeModel.value?.open('launch')
		.then(async e => {
			if (!e) return;
			await useLaunchStore().remove(launch.id);
			brokenLaunches.remove(launch)
		})
}
const selected = ref(0);
</script>

<template>
	<Container padding="0">
		<template v-slot:header>
			<v-toolbar :class="$style.toolbar">
				<v-btn :icon="mdiArrowLeft" variant="text" to="/" :class="$style.side" />
				<v-toolbar-title :class="[$style.title, 'text-center ma-0']">
					{{ $t('configure.fix_launches') }}
				</v-toolbar-title>
			</v-toolbar>
		</template>

		<div v-if="brokenLaunches.count == 0" :class="$style.center">
			<span class="text-h6">
				{{ $t('game.you_fix_all') }}
			</span>
		</div>


		<v-expansion-panels v-else tile variant="accordion" static :class="$style.game_list" v-model="selected">
			<v-expansion-panel v-for="{ launches, game } in brokenLaunches.list">
				<v-expansion-panel-title :class="$style.expans_title" :style="{ '--bg-image': `url(${game.image})` }">
					{{ game.name }}
				</v-expansion-panel-title>
				<v-expansion-panel-text class="pa-0">
					<List :launchs="launches" detail>
						<template v-slot:append="{ launch }">
							<v-btn :icon="mdiPencil" variant="text" v-tooltip="$t('game.edit_launch')"
								@click="editor?.edit(launch.id)" />
							<v-btn color="error" :icon="mdiTrashCan" variant="text" v-tooltip="$t('game.remove_launch')"
								@click="delet(launch)" />
						</template>
					</List>
				</v-expansion-panel-text>
			</v-expansion-panel>
		</v-expansion-panels>
	</Container>
	<Editor ref="editor" @create="create" />
	<ConfirmRemove ref="remove" />
</template>

<style module>
.toolbar {
	background: transparent;
}

.toolbar .title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	white-space: nowrap;
}

.expans_title {
	background-image: linear-gradient(to right, rgb(var(--v-theme-surface)) calc(100% - 430px), transparent), var(--bg-image, none);
	background-position: right center;
	background-size: 100% 100%, 460px auto;
	background-repeat: no-repeat;
}

.game_list :global(.v-expansion-panel-text__wrapper) {
	padding: 0;
}

.center {
	justify-content: center;
	align-items: center;
	display: flex;
	height: calc(100% - 1px);
}
</style>
