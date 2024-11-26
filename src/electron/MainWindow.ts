import { BrowserWindow, nativeImage } from 'electron'
import path from 'node:path'
import { VITE_DEV_SERVER_URL, RENDERER_DIST, dirname, PUBLIC_PATH } from './consts';
import Steam from './Steam';
import IPCMessages from './IPCMessages';
import Config from './Config';
import IConfig from '../IConfig';

namespace MainWindow {
	let instance: BrowserWindow | null = null;
	const steam = Steam.getInstance();

	export function open() {
		if (instance) {
			instance.focus();
			return;
		}

		const icon = nativeImage.createFromPath(path.join(PUBLIC_PATH, `logo-light.png`))
		const win = new BrowserWindow({
			icon: icon,
			frame: false,
			minWidth: 600,
			webPreferences: {
				webSecurity: !VITE_DEV_SERVER_URL,
				devTools: !!VITE_DEV_SERVER_URL,
				preload: path.join(dirname, 'preload.mjs'),
			},
		})

		const web = win.webContents;
		const ipc = web.ipc;


		//System-Bar
		ipc.on(IPCMessages.SystemBar.minimize, () => win.minimize());
		ipc.on(IPCMessages.SystemBar.close, () => win.close())
		ipc.on(IPCMessages.SystemBar.maximize, () => win.isMaximized() ? win.unmaximize() : win.maximize())
		win.on('maximize', () => web.send(IPCMessages.SystemBar.changeMaximized, true))
		win.on('unmaximize', () => web.send(IPCMessages.SystemBar.changeMaximized, false))
		win.on('close', () => instance = null);

		//Steam Module
		steam.on('changeInitState', (state, message) => web.send(IPCMessages.Steam.changeInitState, state, message))
		ipc.handle(IPCMessages.Steam.getCurrentState, () => steam.getState())

		//Config Module
		const cfg = Config.getInstance();
		ipc.handle(IPCMessages.Config.get, () => cfg.toJSON());
		ipc.on(IPCMessages.Config.edit, <T extends keyof IConfig>(_: any, field: T, value: IConfig[T]) => {
			(cfg as IConfig)[field] = value;
			cfg.save();
		})


		if (VITE_DEV_SERVER_URL) {
			win.loadURL(VITE_DEV_SERVER_URL)
			web.openDevTools({ mode: 'undocked', });
		} else {
			win.loadFile(path.join(RENDERER_DIST, 'index.html'))
		}
		instance = win;
	}
}

export default MainWindow;
