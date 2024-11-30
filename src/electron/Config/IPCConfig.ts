import IConfig from "../../IConfig";
import Config from "./Config";
import ConfigMessages from "./IPCMessages";
import IPCSerivce from "../Serivce.ipc";
import { IPCTunnel } from "../Window";

class IPCConfig extends IPCSerivce {
	protected constructor(private cfg: Config) {
		super();
	}

	init(ipc: IPCTunnel): void {
		ipc.handle(ConfigMessages.get, () => this.cfg.toJSON());
		ipc.on(ConfigMessages.edit, <T extends keyof IConfig>(field: T, value: IConfig[T]) => {
			(this.cfg as IConfig)[field] = value;
			this.cfg.save();
		})
	}

	public static create() {
		return new IPCConfig(Config.getInstance());
	}
}

export default IPCConfig;
