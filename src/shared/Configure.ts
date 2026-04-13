enum Messages {
	canUseAppInfo = 'configure.canUseAppInfo',
	onCanUseAppInfo = "configure.onCanUseAppInfo",
	setUseAppInfo = "configure.setUseAppInfo",
	useAppInfo = "configure.useAppInfo",
	integrateSteam = "configure.integrateSteam",
	setIntegrateSteam = "configure.setIntegrateSteam",

	checkNeedWrite = "configure.getNeedWrite",
	changeNeedWrite = "configure.changeNeedWrite",
	write = "configure.write",
	getBrokenLaunches = "configure.getBrokenLaunches",
}
interface CanUseAppInfoListener { (state: boolean): void; };
interface ChangeNeedWriteListener { (state: boolean): void; };
const INTEGRATE_STEAM = 'integrate_steam';
const USE_APPINFO = 'use_appinfo';

export { Messages, USE_APPINFO, INTEGRATE_STEAM }
export {
	type ChangeNeedWriteListener,
	type CanUseAppInfoListener
}
