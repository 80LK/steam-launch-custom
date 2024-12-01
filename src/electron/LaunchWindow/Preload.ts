import { ipcRenderer as IPCRenderer } from 'electron'
import LaunchWindowMessages from './IPCMessages';

namespace LaunchWindow {
	const gameId_arg = process.argv.find(e => e.startsWith('--game_id'));
	export const gameId = parseInt(gameId_arg ? gameId_arg.split('=')[1] : '0');

	export function start(launch?: number) {
		IPCRenderer.send(LaunchWindowMessages.start, launch);
	}
}
type NLaunch = typeof LaunchWindow;
declare global {
	const LaunchWindow: NLaunch;
}

export default LaunchWindow;
