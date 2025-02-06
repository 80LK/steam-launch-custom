import { IGame, Messages } from "@shared/Game";
import { ipcRenderer } from "electron";

namespace Game {
	export function getAll(offset: number, limit: number, search: string | null): Promise<IGame[]> {
		return ipcRenderer.invoke(Messages.getAll, offset, limit, search);
	}

	export function stared(id: number, stared: boolean): Promise<boolean> {
		return ipcRenderer.invoke(Messages.stared, id, stared);
	}

	export function scan(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.scan);
	}

	export function configure(id: number): Promise<boolean> {
		return ipcRenderer.invoke(Messages.configure, id);
	}
	export function resetConfigure(id: number): Promise<boolean> {
		return ipcRenderer.invoke(Messages.resetConfigure, id);
	}

	export function needWrite(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.needWrite);
	}

	export function write(): Promise<number[]> {
		return ipcRenderer.invoke(Messages.write);
	}

	export function getLaunch(): Promise<IGame | null> {
		return ipcRenderer.invoke(Messages.getLaunch);
	}
}

export default Game;
