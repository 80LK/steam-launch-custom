import { BrowserWindow, nativeImage } from 'electron'
import path from 'node:path'
import { VITE_DEV_SERVER_URL, RENDERER_DIST, dirname, PUBLIC_PATH } from './consts';

namespace MainWindow {
	let instance: BrowserWindow | null = null;

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
		ipc.on('try-minimize', () => win.minimize());
		ipc.on('try-close', () => win.close())
		ipc.on('try-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize())
		win.on('maximize', () => web.send("changeMaximized", true))
		win.on('unmaximize', () => web.send("changeMaximized", false))
		win.on('close', () => instance = null);

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
