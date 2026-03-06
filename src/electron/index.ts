import SystemBar from './SystemBar';
import App from './App';
import MainWindow from './Window/MainWindow';
import Database from './Database/Database';
import Settings from './Database/Settings';
import Game from './Database/Game';
import Steam from './Steam';
import ImageProtocol from './Protocol/ImgaeProtocol';
import Launch from './Database/Launch';
import Updater from './Updater';
import LaunchWindow from './Window/LaunchWindow';
import Spawn from './Spawn';
import Logger from './Logger';
import Configure from './Configure/Configure';
import Wrapper from './Wrapper';
import { dirname } from 'path';
import { dialog, app as electron, } from "electron";
import { name, version } from '../../package.json';

// process.argv.push('--app=41700');

Database.debug({ logSql: true })

const launchId = App.getLaunchId();
const isGame = launchId !== 0;


if (isGame) {
	(async () => {
		const _void = () => void 0;
		await Logger.get(`log.launch.${launchId}.txt`).init(_void);
		Database.get(true);

		const launch = await Launch.get(launchId);
		if (!launch) return;

		const steam = Steam.get();
		await steam.init(_void);

		if (!steam.startSDK(launch.game_id)) {
			dialog.showMessageBoxSync({
				title: `${name}-${version}`,
				message: "Can't init SteamSDK and start Steam"
			});
			return electron.quit();
		}

		const spawn = Spawn.get();
		spawn.onClose(() => {
			electron.quit()
			Steam.stopSDK();
		});
		spawn.start(
			launch.execute,
			launch.launch,
			launch.workdir || dirname(launch.execute)
		);
	})();
} else {
	const appId = App.getAppId();
	const isLaunch = appId !== 0;

	const image = ImageProtocol.get();

	const app = App.create(isLaunch ? LaunchWindow : MainWindow)
		.setPath(isLaunch ? `game/${appId}` : 'main')
		.init(
			Logger.get(isLaunch ? `log.${appId}.txt` : 'log.txt'),
			Steam.get(),
			Database.get().register(Settings, Game, Launch),
			ImageProtocol
		)
		.useIPC(
			SystemBar,
			Settings.IPC,
			Logger.IPC,
			Game.IPC,
			Launch.IPC
		)
		.addProtocols(image);

	if (isLaunch) {
		const spawn = Spawn.get();
		spawn.onClose(() => app.quit());
		app.setCloseCondition(() => !spawn.hasRunning)
			.open();
	} else {
		app.init(
			Wrapper,
			Configure
		).useIPC(
			Steam.IPC,
			Updater.IPC,
			Configure.IPC
		)
			.open(async (setmessage) => {
				setmessage("init.scan")
				Configure.init();
			});
	}
}


process.on('uncaughtException', (err) => {
	Logger.error(err.message + '\n' + err.stack, { prefix: 'MAIN' });
});

// Отлов необработанных отклонений промисов
process.on('unhandledRejection', (reason) => {
	Logger.error(<any>reason, { prefix: 'MAIN' });
});
