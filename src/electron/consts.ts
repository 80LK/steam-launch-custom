import { createRequire } from 'module';
import { dirname as getDirname, join, resolve } from 'path';
import { fileURLToPath } from 'url'
import { author, name } from "../../package.json"
import { mkdirSync } from "fs";
import { app } from "electron";

export const require = createRequire(import.meta.url)

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173/';
export const DEV = !app.isPackaged;

export const dirname = getDirname(fileURLToPath(import.meta.url))
export const ASAR_ROOT = join(dirname, '..')

export const RENDERER_DIST = join(ASAR_ROOT, 'dist')

export function getAppDataFilePath(file: string = "./", isDir: boolean = false): string {
	const home_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

	const app_data_path = resolve(home_path, author, app.isPackaged ? name : name + '-dev');

	if (file.startsWith("/")) file = '.' + file;
	const path = resolve(app_data_path, file);


	const dirPath = isDir ? path : getDirname(path);
	mkdirSync(dirPath, { recursive: true });

	return path;
}
