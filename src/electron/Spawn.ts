import { spawn } from 'child_process';
import Service, { ServiceEventsMap } from './Service';

interface SpawnEvents extends ServiceEventsMap {
	closeAll: []
}

class Spawn extends Service<SpawnEvents> {
	protected _init() { }
	private processes: Set<number> = new Set();
	public get hasRunning() {
		return this.processes.size !== 0
	}

	private exit(pid: number) {
		this.processes.delete(pid);
		if (!this.hasRunning)
			this.emit('closeAll');
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
	public static getInstance() {
		if (!this._instance) this._instance = new Spawn("Spawn");

		return this._instance;
	}
}

export default Spawn;
