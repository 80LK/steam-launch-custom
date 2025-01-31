import IPCMessages from "../electron/AppMessages";
import { ipcRenderer } from 'electron'
import { name, version } from '../../package.json';
import EventMap from "./EventMap";

namespace App {
	interface ChangeInitStateListener {
		(message: string | null): void;
	}
	const changeInitStateListeners = new EventMap<ChangeInitStateListener>(IPCMessages.changeInitState)
	export function onChangeInitState(listener: ChangeInitStateListener) {
		return changeInitStateListeners.on(listener);
	};
	export function offChangeInitState(listener: number) {
		changeInitStateListeners.off(listener);
	};
	export async function getCurrentInitState(): Promise<string | null> {
		return await ipcRenderer.invoke(IPCMessages.getCurrentState);
	}

	export const versions = {
		get [name]() {
			return version
		}
	}
}

export default App;
