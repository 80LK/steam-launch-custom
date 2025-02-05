const SCAN_GAME_IN_LAUNCH_KEY = "scanGameLaunch";

interface IGame {
	id: number;
	name: string;
	addTimestamp: number;

	installed: boolean;
	configured: boolean;
	needWrite: boolean;

	stared: boolean;

	image: string;
}

enum Messages {
	getAll = 'game.getAll',
	stared = 'game.stared',
	scan = 'game.scan',
	configure = 'game.configure',
	resetConfigure = 'game.resetConfigure',
	needWrite = 'game.needWrite',
	write = 'game.write'
}

export {
	type IGame,
	Messages,
	SCAN_GAME_IN_LAUNCH_KEY
}
