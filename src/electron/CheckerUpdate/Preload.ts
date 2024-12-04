
import { ipcRenderer as IPCRenderer } from 'electron'
import CheckerUpdateMessages from './IPCMessages';
import { UpdateInfo } from '../../UpdateInfo';

namespace CheckerUpdate {
	export async function check(): Promise<UpdateInfo> {
		return await IPCRenderer.invoke(CheckerUpdateMessages.check);
	}

	export async function download(): Promise<boolean> {
		return await IPCRenderer.invoke(CheckerUpdateMessages.download);
	}


	export async function install(): Promise<boolean> {
		return await IPCRenderer.invoke(CheckerUpdateMessages.install);
	}
}

type NCheckerUpdate = typeof CheckerUpdate;
declare global {
	const CheckerUpdate: NCheckerUpdate;
}

export default CheckerUpdate;
