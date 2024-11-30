import { ipcRenderer as IPCRenderer } from 'electron'
import SystemBarMessages from "./IPCMessages";

namespace SystemBar {
	export function minimize() {
		IPCRenderer.send(SystemBarMessages.minimize);
	}

	export function maximize() {
		IPCRenderer.send(SystemBarMessages.maximize);
	}
	export function close() {
		IPCRenderer.send(SystemBarMessages.close);
	}

	export interface ChangeMaximizedListener {
		(maximized: boolean): void;
	};
	const changeMaximizedListeners = new Map<number, ChangeMaximizedListener>();
	let changeMaximizedCounter = 0;
	IPCRenderer.on(SystemBarMessages.changeMaximized, (_, value: boolean) => {
		changeMaximizedListeners.forEach(e => e(value));
	})
	export function onChangeMaximized(listener: ChangeMaximizedListener) {
		changeMaximizedListeners.set(++changeMaximizedCounter, listener);
		return changeMaximizedCounter;
	};
	export function offChangeMaximized(listener: number) {
		changeMaximizedListeners.delete(listener);
	};

}
type NSystemBar = typeof SystemBar;
declare global {
	const SystemBar: NSystemBar;
}

export default SystemBar;
