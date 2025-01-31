import { BrowserWindow } from 'electron';
import { VITE_DEV_SERVER_URL, DEV, dirname, RENDERER_DIST } from './consts';
import { join } from 'path';
import getIPCTunnel from './IPCTunnel';

const Window = () => {
	const win = new BrowserWindow({
		frame: false,
		minWidth: 600,
		minHeight: 440,
		webPreferences: {
			devTools: DEV,
			preload: join(dirname, './preload.js')
		}
	});
	const ipc = getIPCTunnel(win);

	if (DEV) {
		win.loadURL(VITE_DEV_SERVER_URL + `/index.html`)
		win.webContents.openDevTools({ mode: 'undocked' });
	} else {
		win.loadFile(join(RENDERER_DIST, `index.html`))
	}

	return { win, ipc };
}

export default Window;
