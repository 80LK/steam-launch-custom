import IPCSerivce from "../Serivce.ipc";
import SystemBarMessages from "./IPCMessages";
import Window, { IPCTunnel } from "../Window";


class IPCSystemBar extends IPCSerivce {
	public init(ipc: IPCTunnel, win: Window): void {
		ipc.on(SystemBarMessages.minimize, () => win.minimize());
		ipc.on(SystemBarMessages.close, () => win.close())
		ipc.on(SystemBarMessages.maximize, () => win.isMaximized() ? win.unmaximize() : win.maximize())
		win.on('maximize', () => ipc.send(SystemBarMessages.changeMaximized, true))
		win.on('unmaximize', () => ipc.send(SystemBarMessages.changeMaximized, false))
	}

	private static _instance: IPCSystemBar;
	public static getInstcance() {
		if (!this._instance) this._instance = new IPCSystemBar();
		return this._instance;
	}
}

export default IPCSystemBar;
