import SystemBar from './SystemBar';
import App from './App';
import MainWindow from './Window/MainWindow';
import Database from './Database/Database';
import Settings from './Database/Settings';
import Game from './Database/Game';
import { SCAN_GAME_IN_LAUNCH_KEY } from '@shared/Game';
import Steam from './Steam';
import ImageProtocol from './Protocol/ImgaeProtocol';
import Launch from './Database/Launch';
import Updater from './Updater';
import LaunchWindow from './Window/LaunchWindow';
import Spawn from './Spawn';
import { DEV } from './consts';
import Logger from './Logger';

if (DEV)
	Database.debug({ logSql: true })


const appId = App.getLaunchApp();
const isLaunch = appId !== 0;
const image = ImageProtocol.get();
const app = App.create(isLaunch ? LaunchWindow : MainWindow)
	.setPath(isLaunch ? `game/${appId}` : 'main')
	.init(
		Logger.get(),
		Steam.get(),
		Database.get().register(Settings, Game, Launch),
	)
	.addProtocols(image);

if (isLaunch) {
	const spawn = Spawn.get();
	spawn.onClose(() => app.quit());
	app.useIPC(
		SystemBar,
		Settings.IPC,
		Game.IPC,
		Launch.IPC,
	)
		.setCloseCondition(() => !spawn.hasRunning)
		.open();
} else {
	app.useIPC(
		SystemBar,
		Settings.IPC,
		Steam.IPC,
		Game.IPC,
		Launch.IPC,
		Updater.IPC
	)
		.open(async (setmessage) => {

			setmessage("init.scan")
			const FIRST_LAUNCH_KEY = 'firstLaunch';
			const firstLaunch = await Settings.getBoolean(FIRST_LAUNCH_KEY, false);
			if (!firstLaunch) {
				await Game.scan()
				Settings.setBoolean(FIRST_LAUNCH_KEY, true);
				return;
			}

			const scanLaunch = await Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false);
			if (scanLaunch) await Game.scan();
		});
}

process.on('uncaughtException', (err) => {
	Logger.error(err.message, { prefix: 'MAIN' });
});

// Отлов необработанных отклонений промисов
process.on('unhandledRejection', (reason) => {
	Logger.error(<any>reason, { prefix: 'MAIN' });
});
