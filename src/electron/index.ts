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

// throw "";
// if(process.argv.indexOf('--launch'))
// 	open_launch_window
// 	init_db
// 	set_quit_condition // чтоб оставить процесс после закрытия окна
// else
// 	open_main_window
// 	init_db
// 	scan_games

//@ts-ignore
const { appId, isLaunch } = (() => {
	const index = process.argv.findIndex(e => e.startsWith('--launch'));
	const isLaunch = index != -1;
	const appId = isLaunch ? parseInt(process.argv[index].split('=')[1]) : 0;
	return { isLaunch, appId }
})()

App.create(MainWindow)
	.setPath('main')
	.init(
		Database
			.debug({ memory: false, logSql: false })
			.get()
			.register(
				Settings,
				Game,
				Launch
			),
		Steam.get(),
	)
	.useIPC(
		SystemBar,
		Settings.IPC,
		Game.IPC,
		Launch.IPC,
		Updater.IPC
	)
	.addProtocols(ImageProtocol.get())
	.open(async () => {
		const FIRST_LAUNCH_KEY = 'firstLaunch';
		const firstLaunch = await Settings.getBoolean(FIRST_LAUNCH_KEY, false);
		if (!firstLaunch) {
			await Game.scan()
			Settings.setBoolean(FIRST_LAUNCH_KEY, true);
			return;
		}

		const scanLaunch = await Settings.getBoolean(SCAN_GAME_IN_LAUNCH_KEY, false);
		if (scanLaunch) Game.scan();
	});
