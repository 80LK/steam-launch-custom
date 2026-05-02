import SystemBar from './SystemBar';
import App from './App';
import MainWindow from './Window/MainWindow';
import Database from './Database/Database';
import Settings from './Database/Settings';
import Game from './Database/Game';
import Steam from './Steam';
import ImageProtocol from './Protocol/ImageProtocol';
import Launch from './Database/Launch';
import Updater from './Updater';
import LaunchWindow from './Window/LaunchWindow';
import Logger from './Logger';
import Configure from './Configure/Configure';
import Wrapper from './Wrapper';

// process.argv.push('--app=41700');

Database.debug({ logSql: true })

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
		Launch.IPC,
		Updater.IPC,
		image.IPC
	)
	.addProtocols(image);

if (isLaunch) {
	app.open();
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


process.on('uncaughtException', (err) => {
	Logger.error(err.message + '\n' + err.stack, { prefix: 'MAIN' });
});

// Отлов необработанных отклонений промисов
process.on('unhandledRejection', (reason) => {
	Logger.error(<any>reason, { prefix: 'MAIN' });
});
