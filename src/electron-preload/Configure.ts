import { ipcRenderer } from "electron";
// import EventMap from "./EventMap";
import {
	ChangeNeedWriteListener,
	// CanUseAppInfoListener,
	// ChangeStateListener,
	Messages
} from "@shared/Configure";
import EventMap from "./EventMap";

namespace Configure {
	export function canUseAppInfo() {
		return ipcRenderer.invoke(Messages.canUseAppInfo);
	}

	export function setUseAppInfo(value: boolean) {
		return ipcRenderer.invoke(Messages.setUseAppInfo, value);
	}

	export function useAppInfo() {
		return ipcRenderer.invoke(Messages.useAppInfo);
	}

	export function checkNeedWrite() {
		return ipcRenderer.invoke(Messages.checkNeedWrite);
	}

	const changeNeedWriteEvents = new EventMap<ChangeNeedWriteListener>(Messages.changeNeedWrite);
	export function onChangeNeedWrite(listener: ChangeNeedWriteListener): number {
		return changeNeedWriteEvents.on(listener);
	}
	export function offChangeNeedWrite(listener: number) {
		changeNeedWriteEvents.off(listener);
	}

	export function write() {
		return ipcRenderer.invoke(Messages.write);
	}
}

export default Configure;
