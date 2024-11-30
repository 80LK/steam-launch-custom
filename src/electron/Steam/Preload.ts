import { ipcRenderer as IPCRenderer } from 'electron'
import SteamMessages from "./IPCMessages";

namespace Steam {

	export async function scanGames() {
		return await IPCRenderer.invoke(SteamMessages.scanGames);
	}
}
type NSteam = typeof Steam;
declare global {
	const Steam: NSteam;
}

export default Steam;
