import Settings from "../Database/Settings";
import { IPCTunnel } from "../IPCTunnel";
import { USE_APPINFO, Messages } from "@shared/Configure"
import Value from "@utils/Value"
import Steam from "../Steam";
import Launch from "../Database/Launch";
import AppInfo from "./AppInfo";
import LocalConfig from "./LocalConfig";
import Game from "../Database/Game";

namespace Configure {
	let useAppInfo = new Value(false, (_, v) => {
		Settings.setBoolean(USE_APPINFO, v)
		needWrite.set(v ? AppInfo.needWrite.get() : LocalConfig.needWrite.get())
	});
	let canUseAppInfo = true;

	export function editLaunch(launch: Launch) {
		AppInfo.configure(launch);
	}
	export function editGame(game: Game) {
		LocalConfig.configure(game);
	}

	export async function init() {
		const inited = await AppInfo.init();

		if (!inited) {
			canUseAppInfo = false;
			useAppInfo.set(false);
		}

		await LocalConfig.init();
		useAppInfo.set(await Settings.getBoolean(USE_APPINFO, false));
	}

	async function write() {
		const steam = Steam.get();
		const SteamIsRunning = await steam.isRunning();
		SteamIsRunning && await steam.stop();

		await Promise.all(
			useAppInfo.get()
				? [AppInfo.write(), LocalConfig.reset()]
				: [LocalConfig.write(), AppInfo.reset()]
		);

		SteamIsRunning && await steam.start();
	}

	const needWrite = new Value(false);
	AppInfo.needWrite.on((_, v) => useAppInfo.get() && needWrite.set(v));
	LocalConfig.needWrite.on((_, v) => (!useAppInfo.get()) && needWrite.set(v));

	export function IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.canUseAppInfo, () => canUseAppInfo);

		ipc.handle(Messages.setUseAppInfo, async (value: boolean) => useAppInfo.set(value))
		ipc.handle(Messages.useAppInfo, () => useAppInfo.get());

		ipc.handle(Messages.checkNeedWrite, () => needWrite.get())
		needWrite.on((_, v) => ipc.send(Messages.changeNeedWrite, v));

		ipc.handle(Messages.write, async () => await write())
	}
}

export default Configure;
