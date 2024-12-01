import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import path from 'node:path'
import { RENDERER_DIST, dirname, VITE_DEV_SERVER_URL } from "./consts";
import IPCSerivce from "./Serivce.ipc";
import Pages from "../Page";

interface IPCTunnel {
	on(channel: string, listener: (...args: any[]) => void): void;
	send(channel: string, ...args: any[]): void;
	handle(channel: string, listener: (...args: any[]) => (Promise<any>) | (any)): void;
}
class Window extends BrowserWindow {
	private _isOpened: boolean = false;
	//@ts-expect-error
	private _page: string;

	protected constructor(page: Pages, options: BrowserWindowConstructorOptions = {}) {
		options = Object.assign(options,
			{
				frame: false,
				minWidth: 600,
				webPreferences: Object.assign({
					devTools: !!VITE_DEV_SERVER_URL,
					preload: path.join(dirname, 'preload.mjs'),
				}, options.webPreferences || {}, {
					additionalArguments: [`--window=${page}`].concat(options.webPreferences?.additionalArguments || []),
				}),
			}
		);

		super(options);
		this._page = page;
		this.on('close', () => {
			this._isOpened = false;
		});
	}

	private getIPCTunnel(): IPCTunnel {
		const web = this.webContents;
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

	public addService(service: IPCSerivce) {
		service.init(this.getIPCTunnel(), this)
	}

	public isOpened() {
		return this._isOpened;
	}
	public open() {
		this._isOpened = true;

		if (VITE_DEV_SERVER_URL) {
			this.loadURL(VITE_DEV_SERVER_URL)
		} else {
			this.loadFile(path.join(RENDERER_DIST, "index.html"))
		}
		this.webContents.openDevTools({ mode: 'undocked' });
		return this;
	}
}

export default Window;
export type { IPCTunnel };
