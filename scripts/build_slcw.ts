import { exec } from "child_process";
import exsist from "../src/utils/exists";
import { resolve } from "path";
import { readFile, writeFile } from "fs/promises";

const root = resolve(process.cwd(), "steam-launch-custom-wrapper");
const node_modules = resolve(root, "node_modules");
const dist = resolve(root, "dist");
const pckg = resolve(root, "package.json");
const builded_version_file = resolve(node_modules, ".slcw-version");

(async () => {
	if (!await exsist(node_modules, 'dir')) {
		const i = exec("npm i", { cwd: root });
		i.stdout?.on('data', console.log);
		i.stderr?.on('data', console.error);
		await new Promise<void>(r => i.on('exit', r));
	}

	const { version } = JSON.parse(await readFile(pckg, 'utf-8'));

	if (await exsist(dist, 'dir')) {
		const builded_version = await readFile(builded_version_file, "utf-8");
		if (version == builded_version) return;
	}

	const build = exec("npm run build", { cwd: root });
	build.stdout?.on('data', console.log);
	build.stderr?.on('data', console.error);
	await new Promise<void>(r => build.on('exit', r));
	await writeFile(builded_version_file, version, "utf-8");
})();
