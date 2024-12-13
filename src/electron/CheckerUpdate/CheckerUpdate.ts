import IPCSerivce from "../Serivce.ipc";
import { IPCTunnel } from "../Window";
import EventEmitter from "../types/EventEmiter"
import { name, author, version } from "../../../package.json";
import CheckerUpdateMessages from "./IPCMessages";
import path from "path";
import { APP_ROOT } from "../consts";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { UpdateInfo, UpdateState } from "../../UpdateInfo";
import { spawn } from "child_process";
import { app } from "electron";

interface GitHubAsset {
	browser_download_url: string;
	name: string;
}
interface Release {
	tag_name: string;
	assets: GitHubAsset[];
}

interface CheckerUpdateEvents {
	checked: []
}

class CheckerUpdate extends EventEmitter<CheckerUpdateEvents> implements IPCSerivce {
	private static readonly DOWNLOAD_PATH: string = path.join(APP_ROOT, "update");
	private currentVersion: string = version;
	private newVersion: string | null = null;
	private asset: string | null = null;
	private state: UpdateState | null = null;

	init(ipc: IPCTunnel): void {
		this.check();

		ipc.handle(CheckerUpdateMessages.check, async () => await this.get());
		ipc.handle(CheckerUpdateMessages.download, async () => await this.download());
		ipc.handle(CheckerUpdateMessages.install, async () => await this.install());
	}

	private async check() {
		if (!app.isPackaged) return this.setState(UpdateState.NO);

		const request = await fetch(`https://api.github.com/repos/${author}/${name}/releases/latest`);
		const release: Release = await request.json();
		const version = release.tag_name;
		if (release.tag_name == this.currentVersion) return this.setState(UpdateState.NO);

		if (this.checkDownloaded(version)) return this.setState(UpdateState.DOWNLOADED, version);

		const asset = release.assets.find(release => release.name.endsWith('Setup.exe'));
		if (!asset) return this.setState(UpdateState.NO);

		this.asset = asset.browser_download_url;
		return this.setState(UpdateState.YES, version)
	}

	private setState(state: UpdateState, version: string | null = null) {
		this.state = state;
		this.newVersion = version;
		this.emit('checked');
	}

	private checkDownloaded(version: string) {
		const exe = CheckerUpdate.getUpdateFile(version);
		return existsSync(exe);
	}

	private get(): Promise<UpdateInfo> {
		if (this.state !== null)
			return Promise.resolve({ version: this.newVersion, state: this.state });

		return new Promise((resolve, reject) =>
			this.once('checked', () =>
				this.state !== null
					? resolve({ version: this.newVersion, state: this.state })
					: reject()
			)
		);
	}
	private async download() {
		if (!this.asset || !this.newVersion) return false;

		const file = await fetch(this.asset);
		if (!file.body) return false;
		const reader = file.body.getReader();
		const update_path = CheckerUpdate.getUpdateFile(this.newVersion);
		const update_file = createWriteStream(update_path);
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				await new Promise<void>(r => update_file.close(() => r()));
				break;
			}

			await new Promise<void>(r => update_file.write(value, () => r()));
		}

		return true;
	}

	private install() {
		if (!this.newVersion) return;
		try {
			spawn(CheckerUpdate.getUpdateFile(this.newVersion), { detached: true });
			app.quit();
		} catch (e) { }
	}

	private static getUpdateFile(version: string) {
		if (!existsSync(CheckerUpdate.DOWNLOAD_PATH)) mkdirSync(CheckerUpdate.DOWNLOAD_PATH);

		return path.join(CheckerUpdate.DOWNLOAD_PATH, `${version}.exe`);
	}
}

export default CheckerUpdate;
