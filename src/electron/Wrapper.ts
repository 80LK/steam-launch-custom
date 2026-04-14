import { resolve } from "path";
import { ASAR_ROOT, DEV } from "./consts";
import exsist from "@utils/exists";
import { copyFile, readFile } from "fs/promises";
import Version from "./Version";
import Steam from "./Steam";
import { ILaunch } from "@shared/Launch";
import Logger from "./Logger";
import { spawn } from "child_process";

namespace Wrapper {
	const WRAPPER = resolve(DEV ? process.cwd() : ASAR_ROOT, "wrapper/slc_wrapper.exe");
	const VERSION_FILE = resolve(DEV ? process.cwd() : ASAR_ROOT, "wrapper/go.ver");

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
		if (launch.id == -1)
			return spawn(launch.execute, launch.launch, { cwd: launch.workdir })

		const argv = [launch.execute, ...launch.launch];
		argv.push('-a', launch.game_id.toString());
		launch.workdir && argv.push('-w', launch.workdir);

		spawn(WRAPPER, argv, { detached: true })
	}

	export function getPath(library: string) {
		return resolve(library, 'slcw.exe');
	}
}

export default Wrapper;
