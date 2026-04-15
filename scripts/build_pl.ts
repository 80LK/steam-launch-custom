import { exec } from "child_process";
import { resolve } from "path";

const CWD = process.cwd();
const root = resolve(CWD, "process_list");

(async () => {
	const build = exec("go run ./scripts build", { cwd: root });
	build.stdout?.on('data', console.log);
	build.stderr?.on('data', console.error);
	await new Promise<void>(r => build.on('exit', r));
})();
