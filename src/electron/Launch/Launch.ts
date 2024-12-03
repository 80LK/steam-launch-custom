import ILaunch from "../../ILaunch";
import Database from "../Database";
import Config from "../Config/Config";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import ImageProtocol from "../ImageProtocol";
import { require, APP_ROOT } from "../consts";
import { ExcludeFields } from "../../utils/ExcludeFields";
import SilentJSON from "../../utils/SilentJSON";
type IconExtractor = (filePath: string, type: "large" | "small") => Buffer;
const iconExtractor: IconExtractor = require("exe-icon-extractor").extractIcon;

type SQLLaunch = ExcludeFields<ILaunch, 'launch'> & { launch: string };

class Launch extends Database.Model implements ILaunch {

	private _id: number = 0;
	public get id(): number { return this._id };
	private set id(value: number) {
		this._id = value;
		this.extractIcon();
	};

	private _game_id: number = 0;
	public get game_id(): number { return this._game_id };
	private set game_id(value: number) {
		this._game_id = value;
		this.extractIcon();
	};

	public name: string = "";
	public _execute: string = "";
	public get execute() {
		return this._execute
	};
	public set execute(value: string) {
		if (this._execute == value) return;

		this._execute = value;
		this.extractIcon();
	};
	public launch: string[] = [];
	public workdir: string = "";

	private get iconPath() {
		return path.resolve(Launch.ICON_CAHCE, `${this.game_id}_${this.id}.ico`);
	}
	public get image(): string {
		return ImageProtocol.getIcon(this);
	};
	private extractIcon() {
		if (this.id == 0 || this.game_id == 0) return;
		if (!existsSync(this._execute)) return;
		try {
			const buf = iconExtractor(this._execute, "large");
			writeFileSync(this.iconPath, buf);
		} catch (e) { }
	}

	public toJSON(): ILaunch {
		return {
			id: this.id,
			game_id: this._game_id,
			name: this.name,
			execute: this.execute,
			launch: this.launch,
			workdir: this.workdir,
			image: this.image
		}
	}

	public async save() {
		const game_id = this.game_id,
			name = this.name,
			execute = this.execute,
			workdir = this.workdir,
			launch = JSON.stringify(this.launch);

		if (this.id == 0) {
			const res = await Launch.run(
				`INSERT INTO ${Launch.DB_NAME} (game_id, name, execute, launch, workdir) values ($game_id, $name, $execute, $launch, $workdir);`,
				{ game_id, name, launch, execute, workdir }
			);
			this.id = res.lastID;
		} else {
			await Launch.run(
				`UPDATE ${Launch.DB_NAME} SET name = $name, execute = $execute, workdir = $workdir, launch = $launch WHERE id = $id AND game_id = $game_id;`,
				{ id: this.id, game_id, name, launch, execute, workdir }
			);
		}
		return this;
	}

	public async remove() {
		await Launch.run(`DELETE FROM ${Launch.DB_NAME} WHERE id = $id AND game_id = $game_id`, {
			id: this.id,
			game_id: this.game_id
		});
	}

	public static create(game_id: number, name: string, execute: string, launch: string[] = [], workdir: string = ""): Launch {
		const game = new this();

		game._game_id = game_id;
		game.name = name;
		game.execute = execute;
		game.launch = launch;
		game.workdir = workdir;

		return game;
	}

	private static createFromSQL(raw: SQLLaunch): Launch {
		const launch = new this();
		launch._id = raw.id;
		launch._game_id = raw.game_id;
		launch._execute = raw.execute;
		launch.name = raw.name;
		launch.launch = SilentJSON.parse(raw.launch, []);
		launch.workdir = raw.workdir;

		return launch;
	}

	public static async find(game_id: number, id: number) {
		const raw_game = await this.get<SQLLaunch>(`SELECT id, game_id, name, execute, launch, workdir installDir FROM ${this.DB_NAME} WHERE game_id = $game_id AND id = $id`, { id, game_id });
		if (!raw_game) return;
		return this.createFromSQL(raw_game);
	}

	public static async findAll(game_id: number) {
		const raw_games = await this.getAll<SQLLaunch>(`SELECT id, game_id, name, execute, launch, workdir FROM ${this.DB_NAME} WHERE game_id = $game_id`, { game_id });
		return raw_games.map(e => this.createFromSQL(e));
	}

	private static readonly DB_NAME = "launch";
	private static readonly CONFIG_NAME = "launch_db_version";
	private static readonly DB_VERSION = 1;
	public static readonly ICON_CAHCE = path.join(APP_ROOT, "cache");

	public static async init() {
		if (!existsSync(this.ICON_CAHCE)) mkdirSync(this.ICON_CAHCE);

		const table_exist = await this.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=$table_name LIMIT 1;", { table_name: this.DB_NAME });
		if (!table_exist) {
			await this.run(`CREATE TABLE ${this.DB_NAME} (
				id INTEGER PRIMARY KEY,
				game_id INT,
				name varchar(255),
				execute TEXT,
				launch TEXT,
				workdir TEXT
			);`);

			await Config.write(this.CONFIG_NAME, this.DB_VERSION.toString());
			return;
		}
		const cur_db_version = parseInt(await Config.read(this.CONFIG_NAME, "0"));
		switch (cur_db_version) {
			case this.DB_VERSION: return;
			case 0: {
				const launchs = await this.getAll<SQLLaunch>(`SELECT id, game_id, launch FROM ${this.DB_NAME} WHERE launch = $launch`, { launch: '' });
				const state = this.prepare(`UPDATE ${this.DB_NAME} SET launch = $launch WHERE id = $id AND game_id = $game_id`);
				await Promise.all(launchs.map(launch => {
					const launchOptions = SilentJSON.parse(launch.launch);
					if (launchOptions) return;
					launch.launch = JSON.stringify(launch.launch.split(' '));
					return state.run(launch)
				}))
				await Config.write(this.CONFIG_NAME, this.DB_VERSION.toString());
			} break;
			default: return console.error(`Unknown DB version ${this.DB_NAME}`);
		}
	}
}

export default Launch;
