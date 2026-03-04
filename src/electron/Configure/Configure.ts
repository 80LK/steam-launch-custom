import Settings from "../Database/Settings";
import { IPCTunnel } from "../IPCTunnel";
import { USE_APPINFO, Messages, INTEGRATE_STEAM } from "@shared/Configure"
import Value from "@utils/Value"
import Steam from "../Steam";
import Launch from "../Database/Launch";
import AppInfo from "./AppInfo";
import LocalConfig from "./LocalConfig";

namespace Configure {
	let useAppInfo = new Value(false, (_, v) => {
		Settings.setBoolean(USE_APPINFO, v)
		needWrite.set(v ? AppInfo.needWrite.get() : LocalConfig.needWrite.get())
	});
	let canUseAppInfo = true;
	let integrateSteam = new Value(true, (_, v) => {
		Settings.setBoolean(INTEGRATE_STEAM, v);
	});

	export function editLaunch(launch: Launch) {
		AppInfo.configure(launch);
	}

	export async function init() {
		integrateSteam.set(await Settings.getBoolean(INTEGRATE_STEAM, true));
		useAppInfo.set(await Settings.getBoolean(USE_APPINFO, false));
		const inited = await AppInfo.init();

		if (!inited) {
			canUseAppInfo = false;
			useAppInfo.set(false);
		}

		await LocalConfig.init();
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

		ipc.handle(Messages.integrateSteam, () => integrateSteam.get());
		ipc.handle(Messages.setIntegrateSteam, async (value: boolean) => integrateSteam.set(value))

		ipc.handle(Messages.checkNeedWrite, () => integrateSteam.get() && needWrite.get())
		needWrite.on((_, v) => ipc.send(Messages.changeNeedWrite, integrateSteam.get() ? v : false));
		integrateSteam.on((_, v) => ipc.send(Messages.changeNeedWrite, v ? needWrite.get() : false));

		ipc.handle(Messages.write, async () => await write())
	}
}

export default Configure;
