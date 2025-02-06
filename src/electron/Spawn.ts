import { spawn } from "child_process";

class Spawn {
	private processes: Set<number> = new Set();
	public get hasRunning() {
		return this.processes.size !== 0
	}

	private _onClose: () => void = () => { };
	public onClose(callback: () => void) {
		this._onClose = callback;
	}

	private exit(pid: number) {
		this.processes.delete(pid);
		if (!this.hasRunning)
			this._onClose();
	}

	public start(exe: string, args: string[], cwd: string) {
		const proc = spawn(exe, args, { cwd });
		if (!proc) return;
		const pid = proc.pid;
		if (!pid) return;
		this.processes.add(pid);
		proc.on('close', () => this.exit(pid));
	}


	private static _instance: Spawn;
	public static get() {
		if (!this._instance) this._instance = new Spawn();

		return this._instance;
	}
}

export default Spawn;
