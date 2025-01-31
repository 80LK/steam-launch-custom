import { BrowserWindow } from "electron";

interface IPCTunnel {
	on(channel: string, listener: (...args: any[]) => void): void;
	send(channel: string, ...args: any[]): void;
	handle(channel: string, listener: (...args: any[]) => (Promise<any>) | (any)): void;
}
function getIPCTunnel(window: BrowserWindow): IPCTunnel {
	const web = window.webContents;
	const ipc = web.ipc;
	return {
		on(channel: string, listener: (...args: any[]) => void) {
			ipc.on(channel, (_, ...args: any[]) => listener(...args));
		},
		send(channel: string, ...args: any[]) {
			web.send(channel, ...args)
		},
		handle(channel: string, listener: (...args: any[]) => (Promise<any>) | (any)) {
			ipc.handle(channel, (_, ...args: any[]) => listener(...args))
		}
	}
}

export default getIPCTunnel;
export { type IPCTunnel };
