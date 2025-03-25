import { ipcRenderer } from "electron";
import { Messages } from "@shared/Logger";

namespace Logger {
	export async function log(message: string) {
		return ipcRenderer.send(Messages.log, message);
	}
	export async function error(message: string) {
		return ipcRenderer.send(Messages.error, message);
	}
}

export default Logger;
