import { app as electron, dialog } from "electron";
import getIPCTunnel, { IPCTunnel } from "./IPCTunnel";
import BaseWindow from "./BaseWindow";
import { resolve, join } from 'path';
import Messages from "./AppMessages";
import { getAppDataFilePath } from "./consts";


interface IInitialable {
	init(setmessage: (msg: string) => void): Promise<void>;
}
type FileType = 'directory' | { name: string, extensions: string[] };

type BaseWindowConstructor = typeof BaseWindow | (() => BaseWindow);

type UseIPC = (win: BaseWindow, ipc: IPCTunnel) => void
class App {
	private constructor(private _windowConstructor: BaseWindowConstructor) { };
	private _window?: BaseWindow;

	private _message: string | null = "Initialization";
	public get message() {
		return this._message;
	}
	public set message(value: string | null) {
		this._message = value;
		this._window && getIPCTunnel(this._window).send(Messages.changeInitState, value);
	}

	private useIPCList = new Set<UseIPC>();
	public useIPC(use: UseIPC, ...uses: UseIPC[]): this;
	public useIPC(...uses: UseIPC[]) {
		uses.forEach(use => this.useIPCList.add(use));
		return this;
	}

	private initsList = new Set<IInitialable>();
	public init(init: IInitialable, ...inits: IInitialable[]): this;
	public init(...inits: IInitialable[]) {
		inits.forEach(init => this.initsList.add(init));
		return this;
	}

	private AppIPC: UseIPC = (_, ipc) => {
		ipc.handle(Messages.getCurrentState, () => this.message);
		ipc.handle(Messages.selectFile, async (_, type: FileType, defaultPath: string) => {
			let property: 'openFile' | 'openDirectory' = 'openFile';
			const filters = [];
			if (type == 'directory') {
				property = 'openDirectory';
			} else {
				filters.push(type);
			}
			if (defaultPath) defaultPath = resolve(defaultPath);
			const { canceled, filePaths } = await dialog.showOpenDialog({ defaultPath, properties: [property], filters: filters });
			if (canceled || filePaths.length == 0) return false;
			return filePaths[0]
		})
	}


	public setPath(path: string) {
		electron.setPath("userData", getAppDataFilePath(join("web_cache", path)));
		return this;
	}

	public open() {
		electron.whenReady().then(async () => {
			if (BaseWindow.isExtends(this._windowConstructor)) {
				this._window = new this._windowConstructor()
			} else {
				this._window = this._windowConstructor();
			}

			const win = this._window;
			const ipc = getIPCTunnel(win);
			this.AppIPC(win, ipc);
			this.useIPCList.forEach(useIPC => useIPC(win, ipc));

			win.open();
			for (const init of this.initsList) {
				await init.init((msg) => this.message = msg)
			}
			this.message = null;
		})

		electron.on('window-all-closed', () => {
			if (process.platform !== 'darwin') {
				electron.quit();
			}
		});
	}

	public static create(window: BaseWindowConstructor) {
		return new App(window);
	}
}
export default App;
export { type IInitialable };
