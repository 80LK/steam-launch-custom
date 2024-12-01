import App from "./App/App";
import Database from "./Database";
import Config from "./Config/Config";
import Game from "./Game/Game";
import Launch from "./Launch/Launch";
import Steam from "./Steam/Steam";
import MainWindow from "./MainWindow";
import IPCSystemBar from "./SystemBar/SystemBar";
import IPCConfig from "./Config/IPCConfig";
import IPCGame from "./Game/IPCGame";
import IPCLaunch from "./Launch/IPCLaunch";
import IPCSteam from "./Steam/IPCSteam";
import LaunchWindow from "./LaunchWindow/LaunchWindow";
import ImageProtocol from "./ImageProtocol";
import path from "path";
import Spawn from "./Spawn";

// process.argv.push('--launch=1540960')
// process.argv.push('D:\\Soft\\Steam\\steamapps\\common\\Underworld Idle\\imp_inf.exe')
// console.log(process.argv);

// "D:\\dev\\electron\\steam-launch-custom\\node_modules\\electron\\dist\\electron.exe" "D:\\dev\\electron\\steam-launch-custom" --no-sandbox --launch=4500 %command%

const imageProtocol = ImageProtocol.getInstance();
const app = App.create()
	.addProtocols(
		imageProtocol
	)
	.addServices(
		Database
			// .debug({ memory: true })
			.init(
				Config,
				Game,
				Launch
			)
	)
	.addIPCServices(
		new IPCSystemBar(),
		IPCConfig.create(),
		new IPCGame(),
		new IPCLaunch(),
		new IPCSteam()
	);

const index = process.argv.findIndex(e => e.startsWith('--launch'));
if (index !== -1) {
	const appId = parseInt(process.argv[index].split('=')[1]);

	if (!appId || isNaN(appId)) app.quit();
	imageProtocol.addType('currentLaunch', () => path.join(Launch.ICON_CAHCE, 'current_launch.ico'));
	const spawn = Spawn.getInstance();
	app
		.setCloseCondition(() => !spawn.hasRunning)
		.addServices(spawn)
		.setPath(`/game/${appId}`)
		.open(() => new LaunchWindow(appId, {
			cmdline: process.argv.slice(index + 1),
			cwd: process.cwd()
		}, { webPreferences: { devTools: true } }));
	spawn.on('closeAll', () => app.quit());
} else {
	app
		.addServices(
			Steam.getInstance()
		)
		.open(() => new MainWindow({ webPreferences: { devTools: true } }))
}
