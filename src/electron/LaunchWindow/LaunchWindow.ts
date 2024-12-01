import Pages from '../../Page';
import Launch from '../Launch/Launch';
import Window from "../Window";
import { BrowserWindowConstructorOptions } from "electron";
import { dirname } from "path";
import LaunchWindowMessages from './IPCMessages';
import Spawn from '../Spawn';

interface CurrentLaunch {
	cmdline: string[];
	cwd: string;
}
class LaunchWindow extends Window {
	constructor(public readonly gameId: number, public readonly currentLaunch: CurrentLaunch, options: BrowserWindowConstructorOptions = {}) {
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
		console.log('try start:', launchId || 'current');
		const spawn = Spawn.getInstance();
		if (!launchId) {
			const { cmdline: [exe, ...args], cwd } = this.currentLaunch;
			spawn.start(exe, args, cwd);
			return this.webContents.close();
		};
		const launch = await Launch.find(this.gameId, launchId);
		if (!launch) return;
		spawn.start(launch.execute, launch.launch.split(' '), launch.workdir || dirname(launch.execute))
		this.webContents.close();
	}
}

export default LaunchWindow;
