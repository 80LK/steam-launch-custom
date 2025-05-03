import { DEV, getAppDataFilePath } from "./consts";
import { IPCTunnel } from "./IPCTunnel";
import { name, author, version as CURRENT_VERSION } from "../../package.json";
import { app as electron } from "electron";
import Settings from "./Database/Settings";
import { CHECK_PRERELEASE_KEY, CheckResult, isCheckResult, Messages, UpdateState } from "@shared/Updater";
import { createWriteStream } from "fs";
import { spawn } from "child_process";
import exsist from "@utils/exists";
import Logger from "./Logger";
import Version from "./Version";

interface GitHubAsset {
	browser_download_url: string;
	name: string;
}
interface Release {
	url: string;
	tag_name: string;
	assets: GitHubAsset[];
}

class Updater {
	private static readonly PATH = getAppDataFilePath('update.exe');
	private static readonly DOWNLOADED_KEY = "update_downloaded";

	private state: UpdateState = UpdateState.NO;
	private asset: string | null = null;
	private current: Version = Version.createFromString(CURRENT_VERSION);
	private available: Version = Version.createFromString(CURRENT_VERSION);

	private async getLastRelease(): Promise<Release | CheckResult> {
		const check_prerelease = await Settings.getBoolean(CHECK_PRERELEASE_KEY, false);
		let request: Response;
		if (!check_prerelease) {
			request = await fetch(`https://api.github.com/repos/${author}/${name}/releases/latest`);
		} else {
			request = await fetch(`https://api.github.com/repos/${author}/${name}/releases`);;
			if (request.status != 200) return this.set(UpdateState.NO)
			const releases = await request.json() as Release[];
			request = await fetch(releases[0].url);
		}

		if (request.status != 200) return this.set(UpdateState.NO)
		return await request.json() as Release;
	}

	private async check(): Promise<CheckResult> {
		if (DEV) return this.set(UpdateState.NO);

		const release = await this.getLastRelease();
		if (isCheckResult(release)) return release;

		console.log("Found version:", release.tag_name)
		const version = Version.createFromString(release.tag_name);
		console.log("Found version:", version)

		if (this.current.compare(version) >= Version.Compare.EQUAL)
			return this.set(UpdateState.NO);

		if (await this.checkDownloaded(version))
			return this.set(UpdateState.DOWNLOADED, version)

		const asset = release.assets.find(release => release.name.endsWith('Setup.exe'));
		if (!asset) return this.set(UpdateState.NO)


		this.asset = asset.browser_download_url;
		return this.set(UpdateState.HAVE, version);
	}

	private async checkDownloaded(version: Version) {
		if (!await exsist(Updater.PATH)) return false;

		const downloaded = await Settings.get(Updater.DOWNLOADED_KEY);
		return version.toString() == downloaded;
	}

	private set(state: UpdateState, version?: Version): CheckResult {
		if (version) this.available = version;
		else version = this.available;

		this.state = state;
		return { state, version: version.toString() }
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
		await Settings.set(Updater.DOWNLOADED_KEY, this.available.toString());
		this.set(UpdateState.DOWNLOADED);
		return true;
	}

	private install() {
		Logger.log(`Try install, status: ${this.state}`)
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
