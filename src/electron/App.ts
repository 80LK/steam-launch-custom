import { app as electron, dialog, protocol, shell } from "electron";
import getIPCTunnel, { IPCTunnel } from "./IPCTunnel";
import BaseWindow from "./Window/BaseWindow";
import { resolve, join } from 'path';
import { FileType, Messages, State, StateMessage } from "@shared/App";
import { DEV, getAppDataFilePath } from "./consts";
import Protocol from "./Protocol/Protocol";
import { spawn } from "child_process";
import Logger from "./Logger";
import { statSync } from "fs";

interface IInitialable {
	init(setmessage: (msg: string) => void): Promise<void>;
}

type BaseWindowConstructor = typeof BaseWindow | (() => BaseWindow);
type UseIPC = (win: BaseWindow, ipc: IPCTunnel) => void
class App {
	private constructor(private _windowConstructor: BaseWindowConstructor) { };
	private _window?: BaseWindow;

	private _message: StateMessage = { message: "init.init", state: State.INIT };
	public get message() {
		return this._message;
	}
	public setMessage(msg: StateMessage['message'], state: StateMessage['state'] = this._message.state) {
		Logger.log(`Try set message "${msg}", state "${state}"`);

		if (this._message.state == State.ERROR)
			Logger.log('Last message was been error, set message cancaled');
		this._message.message = msg;
		this._message.state = state;
		this._window && getIPCTunnel(this._window).send(Messages.changeInitState, this._message);
	}

	private useIPCList = new Set<UseIPC>();
	public useIPC(use: UseIPC, ...uses: UseIPC[]): this;
	public useIPC(...uses: UseIPC[]) {
		uses.forEach(use => this.useIPCList.add(use));
		return this;
	}
	private AppIPC: UseIPC = (win, ipc) => {
		ipc.handle(Messages.getCurrentState, () => this.message);
		ipc.handle(Messages.selectFile, async (type: FileType, defaultPath: string) => {
			let property: 'openFile' | 'openDirectory' = 'openFile';
			const filters = type == 'directory' ? [] : type;
			if (type == 'directory') {
				property = 'openDirectory';
			}

			if (defaultPath) defaultPath = resolve(defaultPath);
			const files = dialog.showOpenDialogSync(win, { defaultPath, properties: [property], filters: filters });

			if (Array.isArray(files))
				return files[0];

			return false;
		})
		ipc.handle(Messages.getAppData, () => getAppDataFilePath())
		ipc.handle(Messages.parentProcessIsSteam, () => App.parentProcessIsSteam());
		ipc.on(Messages.openExplorer, (dir: string) => {
			dir = resolve(dir);
			while (!statSync(dir).isDirectory()) {
				dir = resolve(dir, "..");
			}
			spawn('explorer', [resolve(dir)], { detached: true })
		})
		ipc.on(Messages.openUrl, (url: string) => {
			shell.openExternal(url);
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
			// win.webContents.ipc.
			const ipc = getIPCTunnel(win);
			this.AppIPC(win, ipc);
			this.useIPCList.forEach(useIPC => useIPC(win, ipc));

			win.open();
			const setmessage = (msg: string) => {
				this.setMessage(msg, State.INIT);
				getIPCTunnel(win).send(Messages.changeInitState, this.message)
			};

			try {
				for (const init of this.initsList) {
					await init.init(setmessage)
				}
			} catch (err) {
				if (err instanceof Error)
					this.setMessage(err.message, State.ERROR);
				else if (typeof err == "string")
					this.setMessage(err, State.ERROR);
				else
					this.setMessage((<any>err).toString(), State.ERROR);
				return;
			}

			ready && await ready(setmessage);
			this.setMessage("init.ready", State.READY);
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

	public static readonly APP_ARG = '--app';
	public static readonly LAUNCH_ARG = '--launch';

	public static getAppId(): number {
		const appId = process.argv.find(e => e.startsWith(this.APP_ARG));
		if (appId === undefined) return 0;
		return parseInt(appId.split('=')[1]);
	}

	public static getLaunchId(): number {
		const launchId = process.argv.find(e => e.startsWith(this.LAUNCH_ARG));
		if (launchId === undefined) return 0;
		return parseInt(launchId.split('=')[1]);
	}

	public static getSteamArgs(): string[] {
		return process.argv.slice(DEV ? 2 : 1).filter(arg => [this.APP_ARG, this.LAUNCH_ARG].findIndex(test => arg.startsWith(test)) == -1);
	}

	public static async parentProcessIsSteam(): Promise<boolean> {
		if (process.ppid <= 1) return false;
		const name = await getProcess(process.ppid);
		return name.toLowerCase() == "steam.exe";
	}
}


async function getProcess(pid: number): Promise<string> {
	return new Promise<string>((r, c) => {
		const wmic = spawn(`wmic`, [
			"process", "where", `ProcessId=${pid}`, "get", "Name,ProcessId", "/format:csv"
		]);

		const processes: Record<number, string> = {};
		wmic.stdout.on('data', (data: Buffer) => {
			const items = data.toString().replace(/[\r]/g, '').split('\n');
			for (const item of items) {
				if (item == '' || item == 'Node,Name,ProcessId') continue;
				const [, name, _pid] = item.split(',');
				const pid = parseInt(_pid);

				processes[pid] = name;
			}
		});
		const err: string[] = [];
		wmic.stderr.on('data', (data: Buffer) => {
			err.push(data.toString());
		});
		wmic.on('exit', () => {
			if (err.length > 0) return c(err.join('\n\r'));
			return r(processes[pid]);
		})
	})
}

export default App;
export { type IInitialable };
