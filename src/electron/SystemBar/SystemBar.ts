import IPCSerivce from "../Serivce.ipc";
import SystemBarMessages from "./IPCMessages";
import Window, { IPCTunnel } from "../Window";


class IPCSystemBar implements IPCSerivce {
	public init(ipc: IPCTunnel, win: Window): void {
		ipc.on(SystemBarMessages.minimize, () => win.minimize());
		ipc.on(SystemBarMessages.close, () => win.close())
		ipc.on(SystemBarMessages.maximize, () => win.isMaximized() ? win.unmaximize() : win.maximize())
		win.on('maximize', () => ipc.send(SystemBarMessages.changeMaximized, true))
		win.on('unmaximize', () => ipc.send(SystemBarMessages.changeMaximized, false))
	}
}

export default IPCSystemBar;
