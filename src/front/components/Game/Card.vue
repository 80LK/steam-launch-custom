<script setup lang="ts">
import { IGame } from "@shared/Game";
import { useRouter } from 'vue-router';
import GameIcons from './Icons.vue';

const router = useRouter();

const { game } = defineProps<{ game: IGame }>()

function open() {
	router.push(`/game/${game.id}`)
}
</script>

<template>
	<v-card width="250" @click="open">
		<v-img class="bg-grey-lighten-2" height="125" cover :src="game.image">
			<div :class="$style['image-content']">
				<GameIcons :game="game" />
			</div>
		</v-img>
		<v-card-title>
			{{ game.name }}
		</v-card-title>
	</v-card>
</template>

<style module>
.image-content {
	text-align: right;
	height: 100%;
	background: linear-gradient(0deg, transparent, #0000008a);
}
</style>
