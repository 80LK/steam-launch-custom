import { BrowserWindowConstructorOptions } from "electron";
import BaseWindow from "./BaseWindow";

class LaunchWindow extends BaseWindow {
	constructor(options: BrowserWindowConstructorOptions = {}) {
		super(Object.assign({
			width: 600,
			height: 259 + 170,
			resizable: false,
			movable: false
		}, options));
		this.setPage('launch.html');
	}
}


export default LaunchWindow;
