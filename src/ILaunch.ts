import { IRunnable } from "./IRunnable";

interface ILaunch extends IRunnable {
	id: number;
	game_id: number;
	name: string;
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
		image: ""
	}
}

export default ILaunch;
export { INIT_LAUNCH }
