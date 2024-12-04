import IPCSerivce from "../Serivce.ipc";
import { IPCTunnel } from "../Window";
import SteamMessages from "./IPCMessages";
import Steam from "./Steam";

class IPCSteam implements IPCSerivce {
	private steam = Steam.getInstance();

	init(ipc: IPCTunnel): void {
		ipc.handle(SteamMessages.scanGames, async () => await this.steam.scanGames())
	}
}

export default IPCSteam;
