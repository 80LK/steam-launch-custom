import IPCSerivce from "../Serivce.ipc";
import { IPCTunnel } from "../Window";
import Game from "./Game";
import GameMessages from "./IPCMessages";

class IPCGame implements IPCSerivce {
	init(ipc: IPCTunnel): void {
		ipc.handle(GameMessages.get, async (id: number) => (await Game.find(id))?.toJSON());
		ipc.handle(GameMessages.getAll, async (limit: number, offset: number, search?: string) => (await Game.findAll(limit, offset, search)).map(e => e.toJSON()));
		ipc.handle(GameMessages.configure, async (id: number) => {
			const game = await Game.find(id);
			if (!game) return;
			return (await game.configure()).toJSON();
		});
		ipc.handle(GameMessages.needWrite, async () => await Game.needWrite());
		ipc.handle(GameMessages.writeConfig, async () => await Game.writeConfig());
	}
}

export default IPCGame;
