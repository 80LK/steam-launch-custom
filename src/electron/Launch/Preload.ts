import ILaunch from "../../ILaunch";
import { ipcRenderer as IPCRenderer } from 'electron'
import LaunchMessages from "./IPCMessages";

namespace Launch {
	export async function getAll(game_id: number): Promise<ILaunch[]> {
		return await IPCRenderer.invoke(LaunchMessages.getAll, game_id);
	}
	export async function create(launch: ILaunch): Promise<ILaunch> {
		return await IPCRenderer.invoke(LaunchMessages.create, launch);
	}

	export async function edit(launch: ILaunch): Promise<ILaunch> {
		return await IPCRenderer.invoke(LaunchMessages.edit, launch);
	}
	export async function remove(game_id: number, id: number): Promise<void> {
		return await IPCRenderer.invoke(LaunchMessages.remove, game_id, id);
	}
}
type NLaunch = typeof Launch;
declare global {
	const Launch: NLaunch;
}

export default Launch;
