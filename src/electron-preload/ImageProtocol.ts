import { Messages } from "@shared/ImageProtocol";
import { ILaunch } from "@shared/Launch";
import { ipcRenderer } from "electron";

namespace ImageProtocol {
	export function generate(launch: Pick<ILaunch, 'game_id' | 'id'>, file: string): Promise<string> {
		return ipcRenderer.invoke(Messages.generate, launch, file);
	}

}

export default ImageProtocol;
