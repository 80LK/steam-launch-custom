import { Messages } from "../electron/SystemBar";
import { ipcRenderer } from 'electron'
import EventMap from "./EventMap";

namespace SystemBar {
	export function minimize() {
		ipcRenderer.send(Messages.minimize);
	}
	export function maximize() {
		ipcRenderer.send(Messages.maximize);
	}
	export function close() {
		ipcRenderer.send(Messages.close);
	}

	interface ChangeMaximizedListener {
		(maximized: boolean): void;
	};
	const changeMaximizedListeners = new EventMap<ChangeMaximizedListener>(Messages.changeMaximized)
	export function onChangeMaximized(listener: ChangeMaximizedListener) {
		return changeMaximizedListeners.on(listener);
	};
	export function offChangeMaximized(listener: number) {
		changeMaximizedListeners.off(listener);
	};
}

export default SystemBar;
