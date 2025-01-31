import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { VITE_DEV_SERVER_URL, DEV, dirname, RENDERER_DIST } from './consts';
import { join } from 'path';

class BaseWindow extends BrowserWindow {
	constructor(options: BrowserWindowConstructorOptions = {}) {
		super(Object.assign({
			frame: false,
		}, options, {
			webPreferences: Object.assign({
				devTools: DEV,
				preload: join(dirname, './preload.js')
			}, options.webPreferences || {})
		}));
	}

	private _page: string = 'index.html';
	public setPage(page: string) {
		this._page = page;
	}

	public open() {
		if (DEV) {
			this.loadURL(VITE_DEV_SERVER_URL + this._page);
			this.webContents.openDevTools({ mode: 'undocked' });
		} else {
			this.loadFile(join(RENDERER_DIST, this._page));
		}
	}

	public static isExtends(window: any): window is typeof BaseWindow {
		return Object.getPrototypeOf(window) == BaseWindow;
	}
}

export default BaseWindow;
