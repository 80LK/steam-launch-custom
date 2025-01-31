import Index from './Index.vue'
// import Game from './Game.vue';
import { createMemoryHistory, createRouter } from 'vue-router'

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{
			path: '/',
			component: Index
		},
		// {
		// 	path: '/game/:gameId(\\d+)',
		// 	component: Game
		// }
	],
});

export default router;
