import { ipcRenderer as IPCRenderer } from 'electron'
import ConfigMessages from "./IPCMessages";
import IConfig from '../../IConfig';

namespace Config {
	export async function get(): Promise<IConfig> {
		return await IPCRenderer.invoke(ConfigMessages.get);
	}

	export function edit<T extends keyof IConfig>(field: T, value: IConfig[T]) {
		IPCRenderer.send(ConfigMessages.edit, field, value);
	}
}
type NConfig = typeof Config;
declare global {
	const Config: NConfig;
}

export default Config;
