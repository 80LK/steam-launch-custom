import { resolve } from "path";
import { RESOURCES, DEV, ROOT } from "./consts";
import exsist from "@utils/exists";
import { copyFile, readFile } from "fs/promises";
import Version from "./Version";
import Steam from "./Steam";
import { ILaunch } from "@shared/Launch";
import Logger from "./Logger";
import { ChildProcess, spawn } from "child_process";

namespace Wrapper {
	const WRAPPER = resolve(DEV ? ROOT : RESOURCES, "wrapper/slc_wrapper.exe");
	const VERSION_FILE = resolve(DEV ? ROOT : RESOURCES, "wrapper/go.ver");

	export async function init() {
		const libraries = Object.values(await Steam.get().getLibraries());

		const VERSION = Version.createFromString(await readFile(VERSION_FILE, "utf-8"));

		for (const library of libraries) {
			const wrapper = resolve(library.path, 'slcw.exe');
			const version_file = resolve(library.path, '.slcwv');

			const version = await exsist(version_file) ? Version.createFromString(await readFile(version_file, "utf-8")) : Version.create(0);
			if (VERSION.compare(version) >= Version.Compare.EQUAL) continue;

			await copyFile(WRAPPER, wrapper);
		}
	}

	export function start(launch: ILaunch) {
		Logger.log(JSON.stringify(launch), { prefix: 'WRAPPER' })

		const argv = [launch.execute, ...launch.launch];
		if (launch.id !== -1) argv.push('-a', launch.game_id.toString());
		launch.workdir && argv.push('-w', launch.workdir);

		return new Promise<ChildProcess>((r, c) => {
			const proc = spawn(WRAPPER, argv, {
				detached: true,
				windowsHide: true
			})

			proc.on('error', (err) => c(err))
			proc.on('spawn', () => r(proc))
		})
	}

	export function getPath(library: string) {
		return resolve(library, 'slcw.exe');
	}
}

export default Wrapper;
