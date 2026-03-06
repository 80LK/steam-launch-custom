import { Messages } from "@shared/ImageProtocol";
import { ipcRenderer } from "electron";

namespace ImageProtocol {
	export function generateIcon(game_id: number, file: string): Promise<string> {
		return ipcRenderer.invoke(Messages.generateIcon, game_id, file);
	}
	export function deleteIcon(game_id: number): Promise<string> {
		return ipcRenderer.invoke(Messages.deleteGeneratedIcon, game_id);
	}

}

export default ImageProtocol;
