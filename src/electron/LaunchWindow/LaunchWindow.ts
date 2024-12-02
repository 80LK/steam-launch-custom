import Pages from '../../Page';
import Launch from '../Launch/Launch';
import Window from "../Window";
import { BrowserWindowConstructorOptions } from "electron";
import { dirname } from "path";
import LaunchWindowMessages from './IPCMessages';
import Spawn from '../Spawn';
import { IRunnable } from '../../IRunnable';

class LaunchWindow extends Window {
	constructor(public readonly gameId: number, public readonly currentLaunch: IRunnable, options: BrowserWindowConstructorOptions = {}) {
		super(
			Pages.LAUNCH,
			Object.assign({
				frame: false,
				width: 600,
				height: 259 + 170,
				resizable: false,
				movable: false
			},
				options,
				{
					webPreferences: Object.assign(options.webPreferences || {},
						{
							additionalArguments: [`--game_id=${gameId}`].concat(options.webPreferences?.additionalArguments || []),
						}),
				})
		);

		this.webContents.ipc.on(LaunchWindowMessages.start, (_, launch?: number) => this.start(launch));
	}

	private async start(launchId?: number) {
		const spawn = Spawn.getInstance();
		const launch = launchId ? await Launch.find(this.gameId, launchId) : this.currentLaunch;
		if (!launch) return;
		spawn.start(launch.execute, launch.launch, launch.workdir || dirname(launch.execute))
		this.webContents.close();
	}
}

export default LaunchWindow;
