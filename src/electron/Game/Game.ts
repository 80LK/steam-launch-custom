import IGame, { GameState } from "../../IGame";
import path from "path";
import Database from "../Database";
import Config from "../Config/Config";

import { existsSync, readFileSync, writeFileSync } from "fs";
import Steam from "../Steam/Steam";
import VDF from "valve-key-values";
import ObjectProxy from "../ObjectProxy";
import ImageProtocol from "../ImageProtocol";

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

	public get image(): string {
		return ImageProtocol.getHeader(this);
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
		const game = new this();

		game._id = id;
		game._name = name;
		game._installDir = installDir;
		game._state = GameState.INSTALLED;

		return game;
	}

	private static createFromSQL(raw: IGame): Game {
		const game = new this();
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
		const raw_game = await this.get<IGame>(`SELECT id, name, state, installDir FROM ${this.DB_NAME} WHERE id = $id`, { id });
		if (!raw_game) return;
		return this.createFromSQL(raw_game);
	}

	public static async findAll() {
		const raw_games = await this.getAll<IGame>(`SELECT id, name, state, installDir FROM ${this.DB_NAME} ORDER BY state DESC`);
		return raw_games.map(e => this.createFromSQL(e));
	}
	public static async init() {
		const rows = await this.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name=$table_name LIMIT 1;", { table_name: this.DB_NAME });
		if (rows) return;

		await this.run(`CREATE TABLE ${this.DB_NAME} (
				id INT PRIMARY KEY,
				name varchar(255),
				state INT,
				installDir TEXT
			);`);
		return;

	}

	public static async countNeedConfigurate(): Promise<number> {
		const { count } = await this.get<{ count: number }>(`SELECT count(*) as count FROM ${this.DB_NAME} WHERE state & $state`, { state: GameState.NEED_WRITE }) || { count: 0 };
		return count;
	}


	public static async needWrite(): Promise<boolean> {
		const count = await this.countNeedConfigurate();
		return count > 0;
	}

	public static async writeConfig() {
		const stop_steam = Steam.stop();
		const games = (await this.getAll<IGame>(`SELECT id, name, state, installDir FROM ${this.DB_NAME} WHERE state & $state`, { state: GameState.NEED_WRITE })).map(e => {
			return this.createFromSQL(e);
		});
		const cfg_path = path.join(
			CFG.steamPath,
			"userdata",
			Steam.getLastUserId().toString(),
			"config/localconfig.vdf"
		);
		const cfg_raw = readFileSync(cfg_path, "utf-8");

		const cfg = new ObjectProxy<LocalConfig>(VDF.parse<any>(cfg_raw));
		const apps_dict = cfg.get("UserLocalConfigStore").get('Software').get('Valve').get('Steam').get('apps')


		for (const game of games) {

			const gameCfg = apps_dict.get(game.id.toString())
			if (!gameCfg) continue;

			const exe = process.argv[0].replace(/\\/g, "/");
			const launch = [`"${exe}"`, ...process.argv.slice(1), `--launch=${game.id}`, "%command%"].join(' ');
			gameCfg.set("LaunchOptions", launch);

			game._state ^= GameState.NEED_WRITE;
			game.save();
		}
		await stop_steam;
		writeFileSync(cfg_path, VDF.strigify(<any>cfg.object));
		await Steam.start();
	}
}

interface LocalConfig {
	UserLocalConfigStore: {
		Software: {
			Valve: {
				Steam: {
					apps: {
						[id: string]: {
							LaunchOptions: string;
						}
					}
				}
			}
		}
	};
}


export default Game;
