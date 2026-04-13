<script setup lang="ts">
import { IGame } from '@shared/Game';

const { game, height = '225px' } = defineProps<{ game: IGame, height?: string }>()
</script>

<template>
	<v-img :class="['bg-grey-lighten-2', $style.header]" cover :src="game.image">
		<v-toolbar :class="$style.toolbar">
			<template #prepend>
				<slot name="toolbar-prepare" />
			</template>
			<v-toolbar-title :class="['text-center ma-0', $style.title]">{{ game.name }} </v-toolbar-title>
			<template #append>
				<slot name="toolbar-append" />
			</template>
		</v-toolbar>

		<slot />
	</v-img>
</template>


<style module>
.header {
	height: var(--header-height, v-bind('height'));
	overflow: visible;
	z-index: 1;
}

.header .toolbar {
	background: linear-gradient(180deg, black, transparent);
	color: white;
}

.header .toolbar .title {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	white-space: nowrap;
}
</style>
