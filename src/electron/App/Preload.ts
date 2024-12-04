import { ipcRenderer as IPCRenderer } from 'electron'
import { name, version } from '../../../package.json';
import AppMessages from "./IPCMesages";
import Pages from '../../Page';
import { FileType } from './App';

namespace App {
	export async function getCurrentState(): Promise<string | null> {
		return await IPCRenderer.invoke(AppMessages.getCurrentState);
	}
	export interface ChangeInitStateListener {
		(message: string | null): void;
	}
	const changeInitStateListeners = new Map<number, ChangeInitStateListener>();
	let changeInitStateCounter = 0;
	IPCRenderer.on(AppMessages.changeInitState, (_, message: string) => {
		changeInitStateListeners.forEach(e => e(message));
	})
	export function onChangeInitState(listener: ChangeInitStateListener) {
		changeInitStateListeners.set(++changeInitStateCounter, listener);
		return changeInitStateCounter;
	};
	export function offChangeInitState(listener: number) {
		changeInitStateListeners.delete(listener);
	};

	export const versions = {
		get node() {
			return process.versions.node;
		},
		get chrome() {
			return process.versions.chrome;
		},
		get electron() {
			return process.versions.electron;
		},
		get [name]() {
			return version
		}
	}

	export async function selectFile(type: FileType, defaultPath?: string) {
		return await IPCRenderer.invoke(AppMessages.selectFile, type, defaultPath);
	}


	const window_arg = process.argv.find(e => e.startsWith('--window'));
	export const page: Pages = window_arg ? <Pages>window_arg.split('=')[1] : Pages.MAIN;
}
type NApp = typeof App;
declare global {
	const App: NApp;
}
export default App;
