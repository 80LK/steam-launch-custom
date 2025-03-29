import { StateMessage, Messages, FileType } from "@shared/App";
import { ipcRenderer } from 'electron'
import { name, version } from '../../package.json';
import EventMap from "./EventMap";

namespace App {
	interface ChangeInitStateListener {
		(message: StateMessage): void;
	}
	const changeInitStateListeners = new EventMap<ChangeInitStateListener>(Messages.changeInitState)
	export function onChangeInitState(listener: ChangeInitStateListener) {
		return changeInitStateListeners.on(listener);
	};
	export function offChangeInitState(listener: number) {
		changeInitStateListeners.off(listener);
	};
	export async function getCurrentInitState(): Promise<StateMessage> {
		return await ipcRenderer.invoke(Messages.getCurrentState);
	}

	export async function getAppData(): Promise<string> {
		return await ipcRenderer.invoke(Messages.getAppData);
	}

	export async function selectFile(type: FileType, defaultPath?: string) {
		return await ipcRenderer.invoke(Messages.selectFile, type, defaultPath);
	}

	export function openExploret(dir: string) {
		ipcRenderer.send(Messages.openExplorer, dir);
	}

	export function openUrl(url: string) {
		ipcRenderer.send(Messages.openUrl, url);
	}

	export const versions = {
		get [name]() {
			return version
		}
	}
}

export default App;
