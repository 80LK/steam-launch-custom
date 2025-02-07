import { DEV, getAppDataFilePath } from "./consts";
import { IPCTunnel } from "./IPCTunnel";
import { name, author, version as CURRENT_VERSION } from "../../package.json";
import { app as electron } from "electron";
import Settings from "./Database/Settings";
import { CheckResult, Messages, UpdateState } from "@shared/Updater";
import { createWriteStream } from "fs";
import { spawn } from "child_process";
import exsist from "@utils/exists";

interface GitHubAsset {
	browser_download_url: string;
	name: string;
}
interface Release {
	tag_name: string;
	assets: GitHubAsset[];
}

class Updater {
	private static readonly PATH = getAppDataFilePath('update.exe');
	private static readonly SETTINGS_KEY = "update_downloaded";

	private state: UpdateState = UpdateState.NO;
	private asset: string | null = null;
	private version: string = CURRENT_VERSION;

	private async check(): Promise<CheckResult> {
		if (DEV) return this.set(UpdateState.NO);

		const request = await fetch(`https://api.github.com/repos/${author}/${name}/releases/latest`);
		if (request.status != 200) return this.set(UpdateState.NO);
		const release: Release = await request.json() as Release;
		const version = release.tag_name;
		if (version == CURRENT_VERSION)
			return this.set(UpdateState.NO);

		if (await this.checkDownloaded(version))
			return this.set(UpdateState.DOWNLOADED, version)

		const asset = release.assets.find(release => release.name.endsWith('Setup.exe'));
		if (!asset) return this.set(UpdateState.NO)


		this.asset = asset.browser_download_url;
		return this.set(UpdateState.HAVE, version);
	}

	private async checkDownloaded(version: string) {
		if (!await exsist(Updater.PATH)) return false;

		const downloaded = await Settings.get(Updater.SETTINGS_KEY);
		return downloaded == version;
	}

	private set(state: UpdateState, version?: string): CheckResult {
		if (version) this.version = version;
		else version = this.version;
		this.state = state;
		return { state, version }
	}

	private async download(): Promise<boolean> {
		if (!this.asset) return false;
		if (this.state != UpdateState.HAVE) return false;

		const file = await fetch(this.asset);
		if (!file.body) return false;
		const reader = file.body.getReader();
		const update_file = createWriteStream(Updater.PATH);
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				await new Promise<void>(r => update_file.close(() => r()));
				break;
			}

			await new Promise<void>(r => update_file.write(value, () => r()));
		}
		await Settings.set(Updater.SETTINGS_KEY, this.version);
		return true;
	}

	private install() {
		if (this.state != UpdateState.DOWNLOADED) return;
		try {
			spawn(Updater.PATH, { detached: true });
			electron.quit();
		} catch (e) { }
	}

	private static _instance: Updater;
	public static get() {
		if (!this._instance) this._instance = new Updater();

		return this._instance;
	}

	public static IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.check, () => Updater.get().check());
		ipc.handle(Messages.download, () => Updater.get().download());
		ipc.handle(Messages.install, () => Updater.get().install());
	}
}


export default Updater;
