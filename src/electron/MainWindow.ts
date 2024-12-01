import Pages from "../Page";
import Window from "./Window";
import { BrowserWindowConstructorOptions } from "electron";

class MainWindow extends Window {
	constructor(options: BrowserWindowConstructorOptions = {}) {
		super(Pages.MAIN, options);
	}
}

export default MainWindow;
