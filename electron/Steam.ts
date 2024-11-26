import { EventEmitter } from "events";

enum InitState {
	READY = 1,
	FIND_STEAM,
	FIND_GAMES
}

interface SteamEventMap {
	initState: [InitState, string]
}

class Steam extends EventEmitter<SteamEventMap> {
	private constructor() {
		super();
	}
	private init() {
		this.findSteam();
		return this;
	}

	private findSteam() {
		this.emit('initState', InitState.FIND_STEAM, 'Find Steam');
		setTimeout(() => {
			this.findGames();
		}, 1000)
	}

	public findGames() {
		this.emit('initState', InitState.FIND_GAMES, 'Find games');
		setTimeout(() => {
			this.emit('initState', InitState.READY, 'Ready');
		}, 1000)
	}

	public static init() {
		return new Steam().init();
	}
}

export default Steam;
