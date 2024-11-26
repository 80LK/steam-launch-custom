enum InitState {
	INIT,
	FIND_STEAM,
	CANT_FIND_STEAM,
	FIND_GAMES,
	READY
}

const INIT_MESSAGE = "Initialization";

export default InitState;
export { INIT_MESSAGE };
