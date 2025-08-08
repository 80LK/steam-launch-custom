import { exec } from "child_process";
import exsist from "../src/utils/exists";
import { resolve } from "path";
import { readFile, writeFile } from "fs/promises";

const CWD = process.cwd();
const root = resolve(CWD, "wrapper");
const node_modules = resolve(CWD, 'node_modules')
const version_file = resolve(root, 'go.ver');
const executable = resolve(root, 'slc_wrapper.exe');
const builded_version_file = resolve(node_modules, ".slcw-version");

(async () => {
	const version = await readFile(version_file, 'utf-8');

	if (await exsist(executable) && await exsist(builded_version_file)) {
		const builded_version = await readFile(builded_version_file, "utf-8");
		if (version == builded_version) return;
	}

	const build = exec("go run ./scripts build", { cwd: root });
	build.stdout?.on('data', console.log);
	build.stderr?.on('data', console.error);
	await new Promise<void>(r => build.on('exit', r));
	await writeFile(builded_version_file, version, "utf-8");
})();
