import { app, dialog, protocol, BrowserWindow } from 'electron'
import Service, { ServiceState } from "../Service";
import Window from "../Window";
import IPCSerivce from '../Serivce.ipc';
import AppMessages from './IPCMesages';
import { join, resolve } from 'path';
import Protocol from '../Protocol';

class App {
	private constructor(private _debug: boolean) { }
	protected _window?: Window;
	private _message: string | null = "Initialization";
	public get message() {
		return this._message;
	}
	protected set message(value: string | null) {
		this._message = value;
		this._debug && console.log(AppMessages.changeInitState, this._message)
		this._window?.webContents.send(AppMessages.changeInitState, this._message);
	}

	protected services: Service[] = [];
	public addServices(...services: Service[]) {
		for (const service of services) {
			service.on('state', (_: ServiceState, message: string) => {
				this.message = `${service.name}: ${message} `;
			})
			this.services.push(service);
		}
		return this;
	}

	protected ipcServices: IPCSerivce[] = [];
	public addIPCServices(...services: IPCSerivce[]) {
		this.ipcServices = this.ipcServices.concat(services);
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


	public open(getWindow: () => Window) {
		// Quit when all windows are closed, except on macOS. There, it's common
		// for applications and their menu bar to stay active until the user quits
		// explicitly with Cmd + Q.
		app.on('window-all-closed', () => {
			if (this.closeCondition() && process.platform !== 'darwin') {
				app.quit();
			}
		});

		app.on('activate', () => {
			// On OS X it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) {
				this._window?.open()
			}
		})

		app.whenReady().then(async () => {
			this.protocols.forEach(prot => {
				protocol.handle(prot.protocol, prot.handle);
			})

			const window = getWindow();
			this._window = window;
			window.webContents.ipc.handle(AppMessages.getCurrentState, () => this._message);
			window.webContents.ipc.handle(AppMessages.selectFile, async (_, type: FileType, defaultPath: string) => {
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

			this.ipcServices.forEach(service => window.addService(service))
			window.open();
			for (const service of this.services) {
				await service.init();
			}
			this.message = null;
		})
	}

	private static _instance: App;
	public static create(debug: boolean = false) {
		if (!this._instance) this._instance = new App(debug);
		return this._instance;
	}

	public setPath(path: string) {
		app.setPath("userData", join(app.getPath("userData"), path));
		return this;
	}

	public quit() {
		app.quit();
	}
}

type FileType = 'directory' | { name: string, extensions: string[] };
export default App;
export type { FileType };
