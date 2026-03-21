import { GameFilter, IGame, Messages } from "@shared/Game";
import { ipcRenderer } from "electron";

namespace Game {
	export function getAll(offset: number, limit: number, search: string | null, filter: GameFilter): Promise<IGame[]> {
		return ipcRenderer.invoke(Messages.getAll, offset, limit, search, filter);
	}
	export function get(game_id: number): Promise<IGame> {
		return ipcRenderer.invoke(Messages.get, game_id);
	}

	export function stared(id: number, stared: boolean): Promise<boolean> {
		return ipcRenderer.invoke(Messages.stared, id, stared);
	}

	export function getLaunch(): Promise<IGame | null> {
		return ipcRenderer.invoke(Messages.getLaunch);
	}
}

export default Game;
