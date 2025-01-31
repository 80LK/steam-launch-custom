import { ipcRenderer } from "electron";
import Messages from "../electron/SettingsMessages";

namespace Settings {
	export async function get(name: string, def?: string) {
		return await ipcRenderer.invoke(Messages.get, name) ?? def ?? null;
	}

	export async function set(name: string, value: string) {
		ipcRenderer.send(Messages.set, name, value)
	}

	export async function getNumber(name: string, def?: number) {
		return (await ipcRenderer.invoke(Messages.getNumber, name)) as number ?? def ?? null;
	}

	export async function setNumber(name: string, value: number) {
		ipcRenderer.send(Messages.setNumber, name, value);
	}


	export async function getBoolean(name: string, def?: boolean) {
		return (await ipcRenderer.invoke(Messages.getBoolean, name)) as boolean ?? def ?? null;
	}

	export async function setBoolean(name: string, value: boolean) {
		ipcRenderer.send(Messages.setBoolean, name, value);
	}
}

export default Settings;
