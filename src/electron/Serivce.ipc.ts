import Window, { IPCTunnel } from "./Window";
abstract class IPCSerivce {
	public constructor() { }

	abstract init(ipc: IPCTunnel, win: Window): void;
}

export default IPCSerivce;
