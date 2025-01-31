import SystemBar from './SystemBar';
import App from './App';
import MainWindow from './MainWindow';
import Database from './Database';
import Settings from './Settings';

// if(process.argv.indexOf('--launch'))
// 	open_launch_window
// 	init_db
// 	set_quit_condition // чтоб оставить процесс после закрытия окна
// else
// 	open_main_window
// 	init_db
// 	scan_games

App.create(MainWindow)
	.setPath('main')
	.init(
		Database
			.debug({ memory: true, logSql: true })
			.get()
			.register(Settings)
	)
	.useIPC(
		SystemBar,
		Settings.IPC
	)
	.open();
