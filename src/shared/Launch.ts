interface ILaunch {
	id: number;
	game_id: number;
	name: string;
	execute: string;
	launch: string[];
	workdir: string;
	image: string;
}

function INIT_LAUNCH(game_id: number = 0): ILaunch {
	return {
		id: 0,
		game_id: game_id,
		name: '',
		execute: '',
		launch: [],
		workdir: '',
		image: ''
	}
}


enum Messages {
	getForGame = 'launch.getForGame',
	create = 'launch.create',
	edit = 'launch.edit',
	remove = 'launch.remove'
}

export {
	type ILaunch,
	Messages,
	INIT_LAUNCH
}
