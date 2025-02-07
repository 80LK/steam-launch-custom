import { BrowserWindowConstructorOptions } from "electron";
import BaseWindow from "./BaseWindow";

class MainWindow extends BaseWindow {
	constructor(options: BrowserWindowConstructorOptions = {}) {
		super(Object.assign({
			minWidth: 835,
			minHeight: 440,
		}, options));
		this.setPage('index.html');
	}
}


export default MainWindow;
