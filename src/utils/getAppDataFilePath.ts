import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import { author, name } from "../../package.json"
import { app } from "electron";

function getAppDataFilePath(file: string = "./"): string {
	const home_path = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

	const app_data_path = resolve(home_path, author, app.isPackaged ? name : name + '-dev');
	if (!existsSync(app_data_path))
		mkdirSync(app_data_path, { recursive: true })


	if (file.startsWith("/")) file = '.' + file;
	const path = resolve(app_data_path, file);
	return path;
}

export default getAppDataFilePath;
