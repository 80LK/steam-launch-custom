import IGame from "../../IGame";
import { ipcRenderer as IPCRenderer } from 'electron'
import GameMessages from "./IPCMessages";

namespace Game {
	export async function get(id: number): Promise<IGame | undefined> {
		return await IPCRenderer.invoke(GameMessages.get, id);
	}

	export async function getAll(): Promise<IGame[]> {
		return await IPCRenderer.invoke(GameMessages.getAll);
	}

	export async function configure(gameId: number): Promise<IGame | undefined> {
		return await IPCRenderer.invoke(GameMessages.configure, gameId)
	}

	export async function needWrite(): Promise<boolean> {
		return await IPCRenderer.invoke(GameMessages.needWrite)
	}
}
type NGame = typeof Game;
declare global {
	const Game: NGame;
}

export default Game;
