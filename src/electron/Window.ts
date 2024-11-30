import { BrowserWindow, nativeImage, BrowserWindowConstructorOptions } from "electron";
import path from 'node:path'
import { PUBLIC_PATH, RENDERER_DIST, dirname, VITE_DEV_SERVER_URL } from "./consts";
import IPCSerivce from "./Serivce.ipc";
import Pages from "../Page";

interface IPCTunnel {
	on(channel: string, listener: (...args: any[]) => void): void;
	send(channel: string, ...args: any[]): void;
	handle(channel: string, listener: (...args: any[]) => (Promise<any>) | (any)): void;
}
class Window extends BrowserWindow {
	private _isOpened: boolean = false;
	private _page: string;

	protected constructor(page: Pages, options: BrowserWindowConstructorOptions = {}) {
		const icon = nativeImage.createFromPath(path.join(PUBLIC_PATH, `logo.png`))
		super(Object.assign(options,
			{
				icon: icon,
				frame: false,
				minWidth: 600,
				webPreferences: Object.assign(options.webPreferences || {}, {
					webSecurity: !VITE_DEV_SERVER_URL,
					devTools: !!VITE_DEV_SERVER_URL,
					preload: path.join(dirname, 'preload.mjs'),
				}),
			}
		));
		this._page = page;
		this.on('close', () => {
			this._isOpened = false;
		})
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
		console.log(VITE_DEV_SERVER_URL)
		if (VITE_DEV_SERVER_URL) {
			this.loadURL(VITE_DEV_SERVER_URL + "?page=" + this._page)
			this.webContents.openDevTools({ mode: 'undocked' });
		} else {
			this.loadFile(path.join(RENDERER_DIST, "index.html?page=" + this._page))
		}
		return this;
	}
}

export default Window;
export type { IPCTunnel };
