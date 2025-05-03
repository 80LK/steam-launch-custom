import { ipcRenderer } from "electron";
import EventMap from "./EventMap";
import { ChangeStateListener, Messages } from "@shared/Configure";

namespace Configure {
	export function getState(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.getState);
	}
	export function canUseAppInfo(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.canUseAppInfo);
	}

	export function wrtie(): Promise<number[]> {
		return ipcRenderer.invoke(Messages.write);
	}

	const changeStateListener = new EventMap<ChangeStateListener>(Messages.changeState)
	export function onChangeState(listener: ChangeStateListener) {
		return changeStateListener.on(listener);
	};
	export function offChangeState(listener: number) {
		changeStateListener.off(listener);
	};
}

export default Configure;
