import exsist from "@utils/exists";
import { IPCTunnel } from "../IPCTunnel";
import Database from "./Database";
import Settings from "./Settings";
import { ILaunch, Messages } from "@shared/Launch";
import { writeFileSync } from "fs";
import extractIcon from "../extractIcon";
import ImageProtocol from "../Protocol/ImgaeProtocol";
import { rm } from "fs/promises";
import App from "../App";
import Game from "./Game";
import Spawn from "../Spawn";
import BaseWindow from "../Window/BaseWindow";
import Logger from "../Logger";
import { dirname } from "path";

type SQLLaunch = Omit<ILaunch, 'launch'> & { launch: string };

class Launch extends Database.Model implements ILaunch {
	id: number = 0;
	game_id: number = 0;
	execute: string = "";
	name: string = "";
	launch: string[] = [];
	workdir: string = "";
	public get image(): string {
		return ImageProtocol.getIcon(this);
	}

	private async generateIcon() {
		if (this.id == 0 || this.game_id == 0) return;
		if (!await exsist(this.execute)) return;
		try {
			const buf = extractIcon(this.execute)
			if (buf)
				writeFileSync(ImageProtocol.getFileIcon(this.game_id, this.id), buf);
		} catch (e) { }
	}

	private static readonly DB_NAME: string = "launch";
	private static readonly DB_VER_KEY: string = "launch-db-ver";
	private static readonly DB_VER: number = 1;

	private static async createFromSQL(raw: SQLLaunch): Promise<Launch> {
		const launch = new this();
		launch.id = raw.id;
		launch.game_id = raw.game_id;
		launch.execute = raw.execute;
		launch.name = raw.name;
		launch.launch = JSON.parse(raw.launch) || [];
		launch.workdir = raw.workdir;

		if (!await exsist(ImageProtocol.getFileIcon(launch.game_id, launch.id)))
			await launch.generateIcon();

		return launch;
	}

	public static async getForGame(game_id: number, offset: number = 0, limit: number = 10) {
		const raw_games = await this.prepare<SQLLaunch>(`SELECT id, game_id, name, execute, launch, workdir FROM ${this.DB_NAME} WHERE game_id = $game_id LIMIT $limit OFFSET $offset;`).getAll({ game_id, offset, limit });
		return await Promise.all(raw_games.map(e => this.createFromSQL(e)));
	}

	public static async get(id: number) {
		const raw_game = await this.prepare<SQLLaunch>(`SELECT id, game_id, name, execute, launch, workdir FROM ${this.DB_NAME} WHERE id = $id`).get({ id });
		if (!raw_game) return null;
		return await this.createFromSQL(raw_game);
	}

	public async save() {
		const game_id = this.game_id,
			name = this.name,
			execute = this.execute,
			workdir = this.workdir,
			launch = JSON.stringify(this.launch);

		if (this.id == 0) {
			const res = await Launch.prepare(`INSERT INTO ${Launch.DB_NAME} (game_id, name, execute, launch, workdir) values ($game_id, $name, $execute, $launch, $workdir);`)
				.run({ game_id, name, launch, execute, workdir });
			this.id = res.lastID;
		} else {
			await Launch.prepare(
				`UPDATE ${Launch.DB_NAME} SET name = $name, execute = $execute, workdir = $workdir, launch = $launch WHERE id = $id AND game_id = $game_id;`
			).run(
				{ id: this.id, game_id, name, launch, execute, workdir }
			);
		}

		await this.generateIcon();

		return this;
	}

	public remove() {
		rm(ImageProtocol.getFileIcon(this.game_id, this.id));
		return Launch.prepare(`DELETE FROM ${Launch.DB_NAME} WHERE id = $id AND game_id = $game_id`)
			.run({
				id: this.id,
				game_id: this.game_id
			});
	}

	public toJSON(): ILaunch {
		return {
			id: this.id,
			game_id: this.game_id,
			name: this.name,
			execute: this.execute,
			launch: this.launch,
			workdir: this.workdir,
			image: this.image
		}
	}

	public static async init() {
		const exsist = await Launch.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name = $name LIMIT 1;").get({ name: Launch.DB_NAME });
		if (exsist) {
			const LEGACY_KEY = "launch_db_version";
			const vers = await Settings.getNumber(Launch.DB_VER_KEY, 0);
			if (vers == Launch.DB_VER) return;

			const legacy_vers = await Settings.getNumber(LEGACY_KEY, 0);
			if (legacy_vers) await Settings.delete(LEGACY_KEY);
			switch (legacy_vers) {
				case 0: {
					const launchs = (await Launch.prepare<SQLLaunch>(`SELECT * FROM ${Launch.DB_NAME}`).getAll());
					const state = this.prepare(`UPDATE ${this.DB_NAME} SET launch = $launch WHERE id = $id AND game_id = $game_id`);
					await Promise.all(launchs.map(launch => {
						if (launch.launch == '') launch.launch = '[]';
						else launch.launch = JSON.stringify(launch.launch.split(' '));
						return state.run({ launch: launch.launch, game_id: launch.game_id, id: launch.id });
					}));
				} break;

				case 1: {
					const launchs = (await Launch.prepare<SQLLaunch>(`SELECT * FROM ${Launch.DB_NAME} WHERE launch NOT LIKE $launch`).getAll({ launch: '[%' }));
					const state = this.prepare(`UPDATE ${this.DB_NAME} SET launch = $launch WHERE id = $id AND game_id = $game_id`);
					await Promise.all(launchs.map(launch => {
						launch.launch = JSON.stringify(launch.launch.split(' '));
						return state.run({ launch: launch.launch, game_id: launch.game_id, id: launch.id });
					}));
				} break;
			}
		} else {
			await Launch.prepare(`CREATE TABLE ${Launch.DB_NAME} (
				id INTEGER PRIMARY KEY,
				game_id INT,
				name VARCHAR(255),
				execute TEXT,
				launch TEXT,
				workdir TEXT
			);`).run();
		}
		await Settings.setNumber(Launch.DB_VER_KEY, Launch.DB_VER);
	}

	public static async getCurrentLaunch(): Promise<ILaunch | null> {
		const game_id = App.getLaunchApp();
		if (game_id == 0) return null;
		const [exe, ...args] = App.getSteamArgs();
		const launch = new Launch();
		launch.name = (await Game.getLaunch())?.name || "";
		launch.id = -1;
		launch.game_id = game_id;
		launch.execute = exe;
		launch.launch = args;
		launch.workdir = process.cwd();
		await launch.generateIcon();
		return launch.toJSON();
	}

	public static IPC(win: BaseWindow, ipc: IPCTunnel) {
		ipc.handle(Messages.getForGame, async (game_id: number, offset: number, limit: number) => (await Launch.getForGame(game_id, offset, limit)).map(e => e.toJSON()))
		ipc.handle(Messages.create, async (launch: ILaunch) => {
			const new_launch = new Launch();
			new_launch.game_id = launch.game_id;
			new_launch.name = launch.name;
			new_launch.execute = launch.execute;
			new_launch.launch = launch.launch;
			new_launch.workdir = launch.workdir;
			await new_launch.save();
			return new_launch.toJSON();
		})
		ipc.handle(Messages.edit, async (ilaunch: ILaunch) => {
			const launch = await Launch.get(ilaunch.id);
			if (!launch) return null;
			launch.name = ilaunch.name;
			launch.execute = ilaunch.execute;
			launch.launch = ilaunch.launch;
			launch.workdir = ilaunch.workdir;
			return (await launch.save()).toJSON();
		})
		ipc.handle(Messages.remove, async (launch_id: number) => {
			const launch = await Launch.get(launch_id);
			if (!launch) return false;
			await launch.remove();
			return true;
		});
		ipc.handle(Messages.getCurrentLaunch, () => Launch.getCurrentLaunch());
		ipc.on(Messages.start, async (id: number) => {
			const launch = await (id == -1 ? Launch.getCurrentLaunch() : Launch.get(id));
			Logger.log(`Try launch ${id}. ${launch ? JSON.stringify(launch) : false}`);
			if (!launch) return false;
			Spawn.get().start(launch.execute, launch.launch, launch.workdir || dirname(launch.execute));
			win.webContents.close();
			return true;
		});
	}
}

export default Launch;
