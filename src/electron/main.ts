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
import CheckerUpdate from "./CheckerUpdate/CheckerUpdate"
import LaunchWindow from "./LaunchWindow/LaunchWindow";
import ImageProtocol from "./ImageProtocol";
import path from "path";
import Spawn from "./Spawn";
import { existsSync, writeFileSync } from "fs";
import { IRunnable } from "../IRunnable";
import { require } from "./consts";
type IconExtractor = (filePath: string, type: "large" | "small") => Buffer;
const iconExtractor: IconExtractor = require("exe-icon-extractor").extractIcon;

const imageProtocol = ImageProtocol.getInstance();
const app = App.create()
	.addProtocols(
		imageProtocol
	)
	.addServices(
		Database
			.debug({
				memory: process.env.DATABASE_MEMORY?.toLowerCase() == "true",
				logSql: process.env.DATABASE_LOG?.toLowerCase() == "true"
			})
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

	const current_icon = path.join(Launch.ICON_CAHCE, `current_launch_${appId}.ico`);
	const current: IRunnable = {
		execute: process.argv[index + 1],
		launch: process.argv.slice(index + 2),
		workdir: process.cwd()
	}

	if (existsSync(current.execute)) {
		const buf = iconExtractor(current.execute, "large");
		writeFileSync(current_icon, buf);
	}

	imageProtocol.addType('currentLaunch', () => current_icon);
	const spawn = Spawn.getInstance();
	app
		.setCloseCondition(() => !spawn.hasRunning)
		.addServices(spawn)
		.setPath(`/game/${appId}`)
		.open(() => new LaunchWindow(appId, current));
	spawn.on('closeAll', () => app.quit());
} else {
	app
		.addServices(
			Steam.getInstance()
		)
		.addIPCServices(
			new CheckerUpdate()
		)
		.open(() => new MainWindow())
}
