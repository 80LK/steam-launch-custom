import { ipcRenderer } from "electron";
import { Messages } from "@shared/Steam";

namespace Steam {
	export async function getPath(): Promise<string> {
		return await ipcRenderer.invoke(Messages.getPath);
	}
}

export default Steam;
