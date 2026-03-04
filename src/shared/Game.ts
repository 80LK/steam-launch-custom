
interface IGame {
	id: number;
	name: string;
	addTimestamp: number;

	installed: boolean;

	stared: boolean;

	image: string;

	countLaunches: number;
}

interface GameFilter {
	installed?: boolean | null;
	stared?: boolean | null;
	haveLaunches?: boolean | null;
}

enum Messages {
	getAll = 'game.getAll',
	stared = 'game.stared',
	getLaunch = 'game.getLaunch'
}

export {
	type IGame,
	Messages,
	type GameFilter,
}
