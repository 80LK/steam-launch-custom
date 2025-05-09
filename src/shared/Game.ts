
interface IGame {
	id: number;
	name: string;
	addTimestamp: number;

	installed: boolean;
	configured: boolean;

	stared: boolean;

	image: string;
}

interface GameFilter {
	installed?: boolean | null;
	stared?: boolean | null;
	configured?: boolean | null;
}

enum Messages {
	getAll = 'game.getAll',
	stared = 'game.stared',
	configure = 'game.configure',
	resetConfigure = 'game.resetConfigure',
	getLaunch = 'game.getLaunch'
}

export {
	type IGame,
	Messages,
	type GameFilter,
}
