import ILaunch from "../../ILaunch";
import Database from "../Database";
import path from "path";
import Config from "../Config/Config";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { createRequire } from 'module';
import { APP_ROOT } from "../consts";
const require = createRequire(import.meta.url);
type IconExtractor = (filePath: string, type: "large" | "small") => Buffer;
const iconExtractor: IconExtractor = require("exe-icon-extractor").extractIcon;

class Launch extends Database.Model implements ILaunch {
	private static readonly DB_NAME = "launch";
	private static readonly ICON_CAHCE = path.join(APP_ROOT, "cache");

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
	public launch: string = "";
	public workdir: string = "";

	private get iconPath() {
		return path.resolve(Launch.ICON_CAHCE, `${this.game_id}_${this.id}.ico`);
	}
	public get image(): string {
		if (existsSync(this.iconPath))
			return this.iconPath;

		return path.join(
			Config.getInstance().steamPath,
			'public/steam_tray.ico'
		)
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
		if (this.id == 0) {
			const res = await Launch.run(`INSERT INTO ${Launch.DB_NAME} (game_id, name, execute, launch, workdir) values ($game_id, $name, $execute, $launch, $workdir);`, {
				game_id: this.game_id,
				name: this.name,
				launch: this.launch,
				execute: this.execute,
				workdir: this.workdir,
			});
			this.id = res.lastID;
		} else {
			await Launch.run(`UPDATE ${Launch.DB_NAME} SET name = $name, execute = $execute, workdir = $workdir, launch = $launch WHERE id = $id AND game_id = $game_id;`,
				{
					id: this.id,
					game_id: this.game_id,
					name: this.name,
					launch: this.launch,
					execute: this.execute,
					workdir: this.workdir,
				});
		}
		return this;
	}

	public async remove() {
		await Launch.run(`DELETE FROM ${Launch.DB_NAME} WHERE id = $id AND game_id = $game_id`, {
			id: this.id,
			game_id: this.game_id
		});
	}

	public static create(game_id: number, name: string, execute: string, launch: string = "", workdir: string = ""): Launch {
		const game = new Launch();

		game._game_id = game_id;
		game.name = name;
		game.execute = execute;
		game.launch = launch;
		game.workdir = workdir;

		return game;
	}

	private static createFromSQL(raw: ILaunch): Launch {
		const launch = new Launch();
		launch._id = raw.id;
		launch._game_id = raw.game_id;
		launch._execute = raw.execute;
		launch.name = raw.name;
		launch.launch = raw.launch;
		launch.workdir = raw.workdir;

		return launch;
	}

	public static async find(game_id: number, id: number) {
		const raw_game = await this.get<ILaunch>(`SELECT id, game_id, name, execute, launch, workdir installDir FROM ${Launch.DB_NAME} WHERE game_id = $game_id AND id = $id`, { id, game_id });
		if (!raw_game) return;
		return this.createFromSQL(raw_game);
	}

	public static async findAll(game_id: number) {
		const raw_games = await this.getAll<ILaunch>(`SELECT id, game_id, name, execute, launch, workdir FROM ${Launch.DB_NAME} WHERE game_id = $game_id`, { game_id });
		return raw_games.map(e => this.createFromSQL(e));
	}
	public static async init() {

		if (!existsSync(Launch.ICON_CAHCE)) mkdirSync(Launch.ICON_CAHCE);

		const rows = await Config.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=$table_name LIMIT 1;", { table_name: Launch.DB_NAME });
		if (rows) return;

		await Config.run(`CREATE TABLE ${Launch.DB_NAME} (
				id INTEGER PRIMARY KEY,
				game_id INT,
				name varchar(255),
				execute TEXT,
				launch TEXT,
				workdir TEXT
			);`);
		return;

	}
}

export default Launch;
