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


(async function main() {
	Database.debug({ logSql: true })

	const appId = App.getAppId();
	const launchId = App.getLaunchId()

	const image = ImageProtocol.get();

	if (appId !== 0) {
		if (launchId !== 0) {
			const launch = await Launch.get(launchId)
			if (launch != null) {
				Wrapper.start(launch)
				return
			}
		}

		App.create(LaunchWindow)
			.setPath(`game/${appId}`)
			.init(
				Logger.get(`log.${appId}.txt`),
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
			.addProtocols(image)
			.open();
	} else {
		App.create(MainWindow)
			.setPath(`main`)
			.init(
				Logger.get(`log.txt`),
				Steam.get(),
				Database.get().register(Settings, Game, Launch),
				ImageProtocol,
				Wrapper,
				Configure
			)
			.useIPC(
				SystemBar,
				Settings.IPC,
				Logger.IPC,
				Game.IPC,
				Launch.IPC,
				Updater.IPC,
				image.IPC,
				Steam.IPC,
				Updater.IPC,
				Configure.IPC
			)
			.addProtocols(image)
			.open(async (setmessage) => {
				setmessage("init.scan")
				Configure.init();
			});
	}


	process.on('uncaughtException', (err) => {
		Logger.error(err.message + '\n' + err.stack, { prefix: 'MAIN' });
	});

	process.on('unhandledRejection', (reason) => {
		Logger.error(<any>reason, { prefix: 'MAIN' });
	});
})()
