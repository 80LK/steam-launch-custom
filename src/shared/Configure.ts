enum Messages {
	getState = 'configure.getState',
	changeState = 'configure.changeState',
	canUseAppInfo = 'configure.canUseAppInfo',
	write = "configure.write",
}
interface ChangeStateListener { (state: boolean): void; };
const USE_APPINFO = 'use_appinfo';

export { Messages, type ChangeStateListener, USE_APPINFO }
