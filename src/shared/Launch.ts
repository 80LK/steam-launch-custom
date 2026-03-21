interface ILaunch {
	id: number;
	game_id: number;
	name: string;
	execute: string;
	launch: string[];
	workdir: string;
	image: string;
	broken: boolean;
}

function INIT_LAUNCH(game_id: number = 0): ILaunch {
	return {
		id: 0,
		game_id: game_id,
		name: '',
		execute: '',
		launch: [],
		workdir: '',
		image: '',
		broken: false
	}
}


enum Messages {
	getForGame = 'launch.getForGame',
	getAllForGame = 'launch.getAllForGame',
	get = 'launch.get',
	create = 'launch.create',
	edit = 'launch.edit',
	remove = 'launch.remove',
	getCurrentLaunch = 'launch.getCurrentLaunch',
	start = 'launch.start',
	createShortcut = 'launch.createShortcut'
}

export {
	type ILaunch,
	Messages,
	INIT_LAUNCH
}
