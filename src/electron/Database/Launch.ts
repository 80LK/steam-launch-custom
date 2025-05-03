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
import Configure from "../Configure";



type SQLLaunch = Omit<ILaunch, 'launch'> & { launch: string, state: Launch.SteamState };
class Launch extends Database.Model implements ILaunch {
	id: number = 0;
	game_id: number = 0;
	execute: string = "";
	name: string = "";
	launch: string[] = [];
	workdir: string = "";
	state: Launch.SteamState = Launch.SteamState.NEED_ADD;
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
	private static readonly DB_VER: number = 2;

	private static async createFromSQL(raw: SQLLaunch): Promise<Launch> {
		const launch = new this();
		launch.id = raw.id;
		launch.game_id = raw.game_id;
		launch.execute = raw.execute;
		launch.name = raw.name;
		launch.launch = JSON.parse(raw.launch) || [];
		launch.workdir = raw.workdir;
		launch.state = raw.state;

		if (!await exsist(ImageProtocol.getFileIcon(launch.game_id, launch.id)))
			await launch.generateIcon();

		return launch;
	}

	public static async getForGame(game_id: number, offset: number = 0, limit: number = 10) {
		const raw_games = await this.prepare<SQLLaunch>(`SELECT * FROM ${this.DB_NAME} WHERE game_id = $game_id AND state != $state LIMIT $limit OFFSET $offset;`).getAll({ game_id, offset, limit, state: Launch.SteamState.NEED_DELETE });
		return await Promise.all(raw_games.map(e => this.createFromSQL(e)));
	}

	public static async getGameIDs() {
		return await this.prepare<Pick<SQLLaunch, 'game_id'>>(`SELECT DISTINCT game_id FROM ${this.DB_NAME}`).getAll().then(e => e.map(({ game_id }) => game_id));

	}
	public static async getAllForGame(game_id: number) {
		return await this.prepare<SQLLaunch>(`SELECT * FROM ${this.DB_NAME} WHERE game_id = $game_id ORDER BY id ASC`).getAll({ game_id }).then(e => Promise.all(e.map(e => this.createFromSQL(e))));
	}

	public static async get(id: number) {
		const raw_game = await this.prepare<SQLLaunch>(`SELECT * FROM ${this.DB_NAME} WHERE id = $id`).get({ id });
		if (!raw_game) return null;
		return await this.createFromSQL(raw_game);
	}


	public async save() {
		const game_id = this.game_id,
			name = this.name,
			execute = this.execute,
			workdir = this.workdir,
			launch = JSON.stringify(this.launch),
			state = this.state;

		if (this.id == 0) {
			const res = await Launch.prepare(`INSERT INTO ${Launch.DB_NAME} (game_id, name, execute, launch, workdir, state) values ($game_id, $name, $execute, $launch, $workdir, $state);`)
				.run({ game_id, name, launch, execute, workdir, state });
			this.id = res.lastID;
		} else {
			await Launch.prepare(
				`UPDATE ${Launch.DB_NAME} SET name = $name, execute = $execute, workdir = $workdir, launch = $launch, state = $state WHERE id = $id AND game_id = $game_id;`
			).run(
				{ id: this.id, game_id, name, launch, execute, workdir, state }
			);
		}

		Configure.editLaunch(this);
		await this.generateIcon();

		return this;
	}

	public remove() {
		rm(ImageProtocol.getFileIcon(this.game_id, this.id));
		this.state = Launch.SteamState.READY;
		Configure.editLaunch(this);
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
			const vers = await Settings.getNumber(Launch.DB_VER_KEY, 0);
			if (vers == Launch.DB_VER) return;

			if (vers == 0) {
				const LEGACY_KEY = "launch_db_version";
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
						await this.prepare(`ALTER TABLE ${this.DB_NAME} ADD COLUMN state INT;`).run()
						await this.prepare(`UPDATE ${this.DB_NAME} SET state = $state`, { state: Launch.SteamState.NEED_ADD }).run();
					} break;

					case 1: {
						const launchs = (await Launch.prepare<SQLLaunch>(`SELECT * FROM ${Launch.DB_NAME} WHERE launch NOT LIKE $launch`).getAll({ launch: '[%' }));
						const state = this.prepare(`UPDATE ${this.DB_NAME} SET launch = $launch WHERE id = $id AND game_id = $game_id`);
						await Promise.all(launchs.map(launch => {
							launch.launch = JSON.stringify(launch.launch.split(' '));
							return state.run({ launch: launch.launch, game_id: launch.game_id, id: launch.id });
						}));

						await this.prepare(`ALTER TABLE ${this.DB_NAME} ADD COLUMN state INT;`).run()
						await this.prepare(`UPDATE ${this.DB_NAME} SET state = $state`, { state: Launch.SteamState.NEED_ADD }).run();
					} break;
				}
			} else if (vers == 1) {
				await this.prepare(`ALTER TABLE ${this.DB_NAME} ADD COLUMN state INT;`).run()
				await this.prepare(`UPDATE ${this.DB_NAME} SET state = $state`, { state: Launch.SteamState.NEED_ADD }).run();
			}
		} else {
			await Launch.prepare(`CREATE TABLE ${Launch.DB_NAME} (
				id INTEGER PRIMARY KEY,
				game_id INT,
				name VARCHAR(255),
				execute TEXT,
				launch TEXT,
				workdir TEXT,
				state INT 
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
		ipc.handle(Messages.create, async (ilaunch: ILaunch) => {
			const launch = new Launch();
			launch.game_id = ilaunch.game_id;
			launch.name = ilaunch.name;
			launch.execute = ilaunch.execute;
			launch.launch = ilaunch.launch;
			launch.workdir = ilaunch.workdir;
			launch.state = Launch.SteamState.NEED_ADD;
			return (await launch.save()).toJSON();
		})
		ipc.handle(Messages.edit, async (ilaunch: ILaunch) => {
			const launch = await Launch.get(ilaunch.id);
			if (!launch) return null;
			launch.name = ilaunch.name;
			launch.execute = ilaunch.execute;
			launch.launch = ilaunch.launch;
			launch.workdir = ilaunch.workdir;
			launch.state = Launch.SteamState.NEED_EDIT;
			return (await launch.save()).toJSON();
		})
		ipc.handle(Messages.remove, async (launch_id: number) => {
			const launch = await Launch.get(launch_id);
			if (!launch) return false;
			if (launch.state == Launch.SteamState.NEED_ADD) {
				launch.state = Launch.SteamState.READY;
				await launch.remove()
			} else {
				launch.state = Launch.SteamState.NEED_DELETE;
				await launch.save();
			}
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
namespace Launch {
	export enum SteamState {
		NEED_ADD = 0,
		READY = 1,
		NEED_EDIT = 2,
		NEED_DELETE = 3
	}
}

export default Launch;
