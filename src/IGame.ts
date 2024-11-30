enum GameState {
	NOT_INSTALL = 0b000,
	INSTALLED = 0b001,
	CONFIGURED = 0b100,
	NEED_WRITE = 0b010
}


export default interface IGame {
	id: number;
	name: string;
	state: GameState;
	installDir: string;
	image: string;
}

export { GameState };
