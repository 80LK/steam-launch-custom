import { CheckResult, Messages } from "@shared/Updater";
import { ipcRenderer } from "electron";

namespace Updater {
	export function check(): Promise<CheckResult> {
		return ipcRenderer.invoke(Messages.check)
	}

	export function download(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.download)
	}

	export function install(): Promise<boolean> {
		return ipcRenderer.invoke(Messages.install)
	}
}

export default Updater;
