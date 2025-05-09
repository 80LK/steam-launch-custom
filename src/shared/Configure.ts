enum Messages {
	canUseAppInfo = 'configure.canUseAppInfo',
	onCanUseAppInfo = "configure.onCanUseAppInfo",
	setUseAppInfo = "configure.setUseAppInfo",
	useAppInfo = "configure.useAppInfo",

	checkNeedWrite = "configure.getNeedWrite",
	changeNeedWrite = "configure.changeNeedWrite",
	write = "configure.write"
}
interface CanUseAppInfoListener { (state: boolean): void; };
interface ChangeNeedWriteListener { (state: boolean): void; };
const USE_APPINFO = 'use_appinfo';

export { Messages, USE_APPINFO }
export {
	type ChangeNeedWriteListener,
	type CanUseAppInfoListener
}
