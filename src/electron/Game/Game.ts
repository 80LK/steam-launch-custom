import IGame, { GameState } from "../../IGame";
import path from "path";
import Database from "../Database";
import Config from "../Config/Config";
import { existsSync } from "fs";
import { globSync } from "glob";
import Steam from "../Steam/Steam";
const CFG = Config.getInstance();

class Game extends Database.Model implements IGame {
	public static name: string = "Game";
	private static readonly DB_NAME = "game";

	private _id: number = 0;
	public get id(): number { return this._id };

	private _name: string = "";
	public get name(): string { return this._name };

	private _installDir: string = "";
	public get installDir(): string { return this._installDir };

	private _state: GameState = GameState.INSTALLED;
	public get state() {
		return this._state;
	}

	public get image() {
		const userdata = path.join(
			CFG.steamPath,
			"userdata",
			Steam.getLastUserId().toString(),
			"config/grid"
		);

		const header_custom = globSync(`${this.id}_hero.{png,jpeg,jpg}`, { cwd: userdata });
		if (header_custom.length) return path.join(userdata, header_custom[0]);

		const librarycache = path.join(CFG.steamPath, "appcache/librarycache");

		const header = globSync(`${this.id}_header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (header.length) return path.join(librarycache, header[0]);

		const library_header = globSync(`${this.id}_library_header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (library_header.length) return path.join(librarycache, library_header[0]);

		return path.join(CFG.steamPath, "tenfoot/resource/images/bootstrapper.jpg");
	}

	public toJSON(): IGame {
		return {
			id: this.id,
			name: this.name,
			state: this._state,
			installDir: this.installDir,
			image: this.image
		}
	}

	public async save() {
		await Game.run(`INSERT OR REPLACE INTO ${Game.DB_NAME} (id, name, state, installDir) values ($id, $name, $state, $installDir);`, { id: this.id, name: this.name, state: this.state, installDir: this.installDir });
		return this;
	}

	public async configure() {
		this._state = GameState.INSTALLED | GameState.CONFIGURED | GameState.NEED_WRITE;
		return await this.save();
	}

	public static create(id: number, name: string = "", installDir: string = ""): Game {
		const game = new Game();

		game._id = id;
		game._name = name;
		game._installDir = installDir;
		game._state = GameState.INSTALLED;

		return game;
	}

	private static createFromSQL(raw: IGame): Game {
		const game = new Game();
		game._id = raw.id;
		game._name = raw.name;
		game._installDir = raw.installDir;
		game._state = raw.state;

		const steamapps = path.join(game.installDir, "../..");
		const manifest_path = path.join(steamapps, `appmanifest_${game.id}.acf`);
		if (!existsSync(manifest_path)) {
			game._state = game.state ^ GameState.NOT_INSTALL;
			game.save();
		}

		return game;
	}

	public static async find(id: number) {
		const raw_game = await this.get<IGame>(`SELECT id, name, state, installDir FROM ${Game.DB_NAME} WHERE id = $id`, { id });
		if (!raw_game) return;
		return this.createFromSQL(raw_game);
	}

	public static async findAll() {
		const raw_games = await this.getAll<IGame>(`SELECT id, name, state, installDir FROM ${Game.DB_NAME} ORDER BY state DESC`);
		return raw_games.map(e => this.createFromSQL(e));
	}
	public static async init() {
		const rows = await Config.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=$table_name LIMIT 1;", { table_name: Game.DB_NAME });
		if (rows) return;

		await Config.run(`CREATE TABLE ${Game.DB_NAME} (
				id INT PRIMARY KEY,
				name varchar(255),
				state INT,
				installDir TEXT
			);`);
		return;

	}

	public static async countNeedConfigurate(): Promise<number> {
		const { count } = await Game.get<{ count: number }>(`SELECT count(*) as count FROM ${Game.DB_NAME} WHERE state & $state`, { state: GameState.NEED_WRITE }) || { count: 0 };
		return count;
	}


	public static async needWrite(): Promise<boolean> {
		const count = await this.countNeedConfigurate();
		return count > 0;
	}
}

export default Game;
