import { app, BrowserWindow } from 'electron'
import Service, { ServiceState } from "../Service";
import Window from "../Window";
import IPCSerivce from '../Serivce.ipc';
import AppMessages from './IPCMesages';

class App {
	private constructor() { }
	protected _window?: Window;
	private _message: string | null = "Initialization";
	public get message() {
		return this._message;
	}
	protected set message(value: string | null) {
		this._message = value;
		console.log(AppMessages.changeInitState, this._message)
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
		this.ipcServices = services;
		return this;
	}

	public open(getWindow: () => Window) {
		// Quit when all windows are closed, except on macOS. There, it's common
		// for applications and their menu bar to stay active until the user quits
		// explicitly with Cmd + Q.
		app.on('window-all-closed', () => {
			if (process.platform !== 'darwin') {
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
			const window = getWindow();
			this._window = window;
			window.webContents.ipc.handle(AppMessages.getCurrentState, () => this._message);
			this.ipcServices.forEach(service => window.addService(service))
			window.open();
			for (const service of this.services) {
				await service.init();
			}
			this.message = null;
		})
	}

	private static _instance: App;
	public static create() {
		if (!this._instance) this._instance = new App();
		return this._instance;
	}
}

export default App;
