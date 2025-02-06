import { app as electron, dialog, protocol } from "electron";
import getIPCTunnel, { IPCTunnel } from "./IPCTunnel";
import BaseWindow from "./Window/BaseWindow";
import { resolve, join } from 'path';
import { FileType, Messages, State, StateMessage } from "@shared/App";
import { getAppDataFilePath } from "./consts";
import Protocol from "./Protocol/Protocol";
import { spawn } from "child_process";


interface IInitialable {
	init(setmessage: (msg: string) => void): Promise<void>;
}

type BaseWindowConstructor = typeof BaseWindow | (() => BaseWindow);
type UseIPC = (win: BaseWindow, ipc: IPCTunnel) => void
class App {
	private constructor(private _windowConstructor: BaseWindowConstructor) { };
	private _window?: BaseWindow;

	private _message: StateMessage = { message: "Initialization", state: State.INIT };
	public get message() {
		return this._message;
	}
	public set message(value: StateMessage) {
		this._message = value;
		this._window && getIPCTunnel(this._window).send(Messages.changeInitState, value);
	}

	private useIPCList = new Set<UseIPC>();
	public useIPC(use: UseIPC, ...uses: UseIPC[]): this;
	public useIPC(...uses: UseIPC[]) {
		uses.forEach(use => this.useIPCList.add(use));
		return this;
	}
	private AppIPC: UseIPC = (_, ipc) => {
		ipc.handle(Messages.getCurrentState, () => this.message);
		ipc.handle(Messages.selectFile, async (type: FileType, defaultPath: string) => {
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
		ipc.handle(Messages.getAppData, () => getAppDataFilePath())
		ipc.on(Messages.openExplorer, (dir: string) => {
			spawn('explorer', [resolve(dir)], { detached: true })
		})
	}

	private initsList = new Set<IInitialable>();
	public init(init: IInitialable, ...inits: IInitialable[]): this;
	public init(...inits: IInitialable[]) {
		inits.forEach(init => this.initsList.add(init));
		return this;
	}

	protected protocols: Protocol[] = [];
	public addProtocols(...protocols: Protocol[]) {
		this.protocols = this.protocols.concat(protocols);
		return this;
	}

	private closeCondition: () => boolean = () => true;
	public setCloseCondition(condition: () => boolean) {
		this.closeCondition = condition;
		return this;
	}

	public setPath(path: string) {
		electron.setPath("userData", getAppDataFilePath(join("web_cache", path)));
		return this;
	}

	public open(ready?: (setmessage: (msg: string) => void) => Promise<void>) {
		electron.whenReady().then(async () => {
			this.protocols.forEach(prot => {
				protocol.handle(prot.protocol, prot.handle);
			})

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
			const setmessage = (msg: string) => this.message.message = msg;
			for (const init of this.initsList) {
				try {
					await init.init(setmessage)
				} catch (err) {

					if (err instanceof Error)
						this.message = { state: State.ERROR, message: err.message }
					else if (typeof err == "string")
						this.message = { state: State.ERROR, message: err }
					else
						this.message = { state: State.ERROR, message: (<any>err).toString() }
					return;
				}
			}
			ready && await ready(setmessage);
			this.message = { state: State.READY, message: "Ready" };
		})

		electron.on('window-all-closed', () => {
			if (this.closeCondition() && process.platform !== 'darwin') {
				electron.quit();
			}
		});
	}

	public quit() {
		electron.quit();
	}

	public static create(window: BaseWindowConstructor) {
		return new App(window);
	}

	public static getExecutable() {
		return process.argv[0].replace(/\\/g, "/");
	}

	public static getLaunchApp(): number {
		const index = process.argv.findIndex(e => e.startsWith('--launch'));
		const isLaunch = index != -1;
		const appId = isLaunch ? parseInt(process.argv[index].split('=')[1]) : 0;
		return appId
	}

	public static getSteamArgs(): string[] {
		const index = process.argv.findIndex(e => e.startsWith('--launch'));
		if (index == -1) return [];
		return process.argv.slice(index + 1);
	}
}
export default App;
export { type IInitialable };
