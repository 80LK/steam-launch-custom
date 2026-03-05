import Settings from "../Database/Settings";
import { IPCTunnel } from "../IPCTunnel";
import { USE_APPINFO, Messages, INTEGRATE_STEAM } from "@shared/Configure"
import Value from "@utils/Value"
import Steam from "../Steam";
import Launch from "../Database/Launch";
import AppInfo from "./AppInfo";
import LocalConfig from "./LocalConfig";
import Logger from "../Logger";

namespace Configure {
	let integrateSteam = new Value(true, (_, v) => {
		Settings.setBoolean(INTEGRATE_STEAM, v);
		checkNeedWrite();
	});
	let canUseAppInfo = true;
	let useAppInfo = new Value(false, (_, v) => {
		Settings.setBoolean(USE_APPINFO, v)
		checkNeedWrite();
	});

	function checkNeedWrite() {
		if (!integrateSteam.get())
			return needWrite.set(LocalConfig.hasConfigured());

		if (!useAppInfo.get())
			return needWrite.set(LocalConfig.needWrite());

		needWrite.set(AppInfo.needWrite.get());
	}


	export function editLaunch(launch: Launch) {
		AppInfo.configure(launch);
		LocalConfig.configure(launch);

		checkNeedWrite();
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
			!integrateSteam.get() ?
				[AppInfo.reset(), LocalConfig.reset()]
				: useAppInfo.get()
					? [AppInfo.write(), LocalConfig.reset()]
					: [LocalConfig.write(), AppInfo.reset()]
		);

		checkNeedWrite();


		SteamIsRunning && await steam.start();
	}

	const needWrite = new Value(false);

	export function IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.canUseAppInfo, () => canUseAppInfo);

		ipc.handle(Messages.setUseAppInfo, async (value: boolean) => useAppInfo.set(value))
		ipc.handle(Messages.useAppInfo, () => useAppInfo.get());

		ipc.handle(Messages.integrateSteam, () => integrateSteam.get());
		ipc.handle(Messages.setIntegrateSteam, async (value: boolean) => integrateSteam.set(value))

		ipc.handle(Messages.checkNeedWrite, () => needWrite.get())
		needWrite.on((_, v) => ipc.send(Messages.changeNeedWrite, v));

		ipc.handle(Messages.write, async () => await write())
	}
}

export default Configure;
