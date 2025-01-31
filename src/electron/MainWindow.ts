import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { VITE_DEV_SERVER_URL, DEV, dirname, RENDERER_DIST } from './consts';
import { join } from 'path';
import BaseWindow from "./BaseWindow";

class MainWindow extends BaseWindow {
	constructor(options: BrowserWindowConstructorOptions = {}) {
		super(Object.assign({
			minWidth: 600,
			minHeight: 440,
		}, options));
		this.setPage('index.html');
	}
}


export default MainWindow;
