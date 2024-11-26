import { BrowserWindow, nativeImage } from 'electron'
import path from 'node:path'
import { VITE_DEV_SERVER_URL, RENDERER_DIST, dirname, PUBLIC_PATH } from './consts';

namespace LaunchWindow {
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
			width: 600,
			height: 259 + 170,
			resizable: false,
			movable: false,
			webPreferences: {
				webSecurity: !VITE_DEV_SERVER_URL,
				devTools: !!VITE_DEV_SERVER_URL,
				preload: path.join(dirname, 'preload.mjs'),
			},
		})

		const web = win.webContents;
		// const ipc = web.ipc;

		if (VITE_DEV_SERVER_URL) {
			win.loadURL(VITE_DEV_SERVER_URL + "?launch")
			web.openDevTools({ mode: 'undocked', });
		} else {
			win.loadFile(path.join(RENDERER_DIST, 'index.html?launch'))
		}
		instance = win;
	}
}

export default LaunchWindow;
