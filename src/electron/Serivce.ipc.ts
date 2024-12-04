import Window, { IPCTunnel } from "./Window";
interface IPCSerivce {
	init(ipc: IPCTunnel, win: Window): void;
}

export default IPCSerivce;
