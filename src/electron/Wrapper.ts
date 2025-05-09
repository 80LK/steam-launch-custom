import { resolve } from "path";
import { ASAR_ROOT, DEV } from "./consts";
import exsist from "@utils/exists";
import { copyFile, readFile } from "fs/promises";
import Version from "./Version";
import Steam from "./Steam";

namespace Wrapper {
	const WRAPPER = DEV ? resolve(process.cwd(), "wrapper/slc_wrapper.exe") : resolve(ASAR_ROOT, 'slc_wrapper.exe');
	const VERSION_FILE = DEV ? resolve(process.cwd(), "wrapper/go.ver") : resolve(ASAR_ROOT, 'wrapper.ver');

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

	export function getPath(library: string) {
		return resolve(library, 'slcw.exe');
	}
}

export default Wrapper;
