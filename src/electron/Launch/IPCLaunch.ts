import ILaunch from "../../ILaunch";
import IPCSerivce from "../Serivce.ipc";
import { IPCTunnel } from "../Window";
import LaunchMessages from "./IPCMessages";
import Launch from "./Launch";

class IPCLaunch implements IPCSerivce {
	init(ipc: IPCTunnel): void {
		ipc.handle(LaunchMessages.getAll, async (game_id: number) => {
			return (await Launch.findAll(game_id)).map(e => e.toJSON());
		})
		ipc.handle(LaunchMessages.create, async (launch: ILaunch) => {
			return (await Launch.create(launch.game_id, launch.name, launch.execute, launch.launch, launch.workdir).save()).toJSON();
		});
		ipc.handle(LaunchMessages.edit, async (raw_launch: ILaunch) => {
			const launch = await Launch.find(raw_launch.game_id, raw_launch.id);
			if (!launch) return;
			launch.name = raw_launch.name;
			launch.workdir = raw_launch.workdir;
			launch.execute = raw_launch.execute;
			launch.launch = raw_launch.launch;
			return (await launch.save()).toJSON();
		});
		ipc.handle(LaunchMessages.remove, async (game_id: number, id: number) => {
			const launch = await Launch.find(game_id, id);
			if (!launch) return;
			await launch.remove();
			return;
		})
	}
}

export default IPCLaunch;
