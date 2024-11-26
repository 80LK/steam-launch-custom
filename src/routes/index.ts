import Index from './Index.vue'
import Game from './Game.vue';

const routes = [
	{
		path: '/',
		component: Index
	},
	{
		path: '/game/:gameId(\\d+)',
		component: Game
	}
]

export default routes;
