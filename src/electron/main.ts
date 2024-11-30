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

App.create()
	.addServices(
		Database.init(
			Config,
			Game,
			Launch
		),
		Steam.getInstance(),
	)
	.addIPCServices(
		new IPCSystemBar(),
		IPCConfig.create(),
		new IPCGame(),
		new IPCLaunch(),
		new IPCSteam()
	)
	.open(() => new MainWindow())
