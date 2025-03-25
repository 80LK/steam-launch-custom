<script setup lang="ts">
import { IGame } from '@shared/Game';

const { game, height = '225px' } = defineProps<{ game: IGame, height?: string }>()
</script>

<template>
	<v-img :class="['bg-grey-lighten-2', $style.header]" cover :src="game.image">
		<v-toolbar :class="$style.toolbar">
			<slot name="toolbar-prepare" />
			<v-toolbar-title class="text-center ma-0">{{ game.name }} </v-toolbar-title>
			<slot name="toolbar-append" />
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
</style>
