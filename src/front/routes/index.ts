import Index from './Index.vue'
import Game from './Game.vue';
import { createMemoryHistory, createRouter } from 'vue-router'
import BrokenLaunches from './BrokenLaunches.vue';

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{
			path: '/',
			component: Index
		},
		{
			path: '/game/:gameId(\\d+)',
			component: Game
		},
		{
			path: '/broken_launches',
			component: BrokenLaunches
		}
	],
});

export default router;
