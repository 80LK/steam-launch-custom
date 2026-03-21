import { ILaunch, Messages } from "@shared/Launch";
import { ipcRenderer } from "electron";

namespace Launch {
	export function getForGame(game_id: number, offset: number, limit: number): Promise<ILaunch[]> {
		return ipcRenderer.invoke(Messages.getForGame, game_id, offset, limit)
	}
	export function getAllForGame(game_id: number): Promise<ILaunch[]> {
		return ipcRenderer.invoke(Messages.getAllForGame, game_id)
	}
	export function get(launch_id: number): Promise<ILaunch> {
		return ipcRenderer.invoke(Messages.get, launch_id)
	}

	export async function create(launch: ILaunch): Promise<ILaunch | null> {
		return (await ipcRenderer.invoke(Messages.create, launch)) || null;
	}

	export async function edit(launch: ILaunch): Promise<ILaunch> {
		return await ipcRenderer.invoke(Messages.edit, launch);
	}

	export async function remove(launch_id: number): Promise<boolean> {
		return await ipcRenderer.invoke(Messages.remove, launch_id);
	}

	export async function createShortcut(launch_id: number): Promise<boolean> {
		return await ipcRenderer.invoke(Messages.createShortcut, launch_id);
	}

	export async function getCurrentLaunch(): Promise<null | ILaunch> {
		return await ipcRenderer.invoke(Messages.getCurrentLaunch);
	}

	export function start(id: number, deatached: boolean = false) {
		ipcRenderer.send(Messages.start, id, deatached);
	}
}

export default Launch;
