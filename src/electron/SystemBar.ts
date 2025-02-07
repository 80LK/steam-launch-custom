import { BrowserWindow } from "electron";
import { IPCTunnel } from "./IPCTunnel";
import { Messages } from "@shared/SystemBar";


function SystemBar(win: BrowserWindow, ipc: IPCTunnel) {
	ipc.on(Messages.minimize, () => win.minimize());
	ipc.on(Messages.close, () => win.close());
	ipc.on(Messages.maximize, () => win.isMaximized() ? win.unmaximize() : win.maximize());
	win.on('maximize', () => ipc.send(Messages.changeMaximized, true))
	win.on('unmaximize', () => ipc.send(Messages.changeMaximized, false))
}

export default SystemBar;
