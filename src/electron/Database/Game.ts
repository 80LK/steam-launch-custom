import Database from "./Database";
import Settings from "./Settings";
import { IGame, Messages } from "@shared/Game";
import parseBoolean from "@utils/parseBoolean";
import Steam from "../Steam";
import { IPCTunnel } from "../IPCTunnel";
import ImageProtocol from "../Protocol/ImgaeProtocol";
import App from "../App";

const steam = Steam.get();

type SQLGame = Pick<IGame, 'id' | 'name' | 'addTimestamp'> & { stared: string, installed: boolean, configured: string, library: string, needWrite: string };

class Game extends Database.Model implements IGame {
	private library: string = '';

	id: number = 0;
	name: string = "";
	stared: boolean = false;
	installed: boolean = false;
	configured: boolean = false;
	needWrite: boolean = false;
	addTimestamp: number = Date.now();

	public get image(): string {
		return ImageProtocol.getHeader(this);
	}

	private static readonly DB_NAME: string = "game";
	private static readonly DB_VER_KEY: string = "game-db-ver";
	private static readonly DB_VER: number = 1;

	public static async init() {
		const exsist = await this.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name = $name LIMIT 1;").get({ name: this.DB_NAME });

		if (exsist) {
			const db_ver = await Settings.getNumber(Game.DB_VER_KEY, 0);
			if (db_ver == Game.DB_VER) return;

			// TODO: MIGRATION
			// /".*\/steam-launch-custom.exe" --launch=\d+ %command%/
			// await this.prepare(`
			// 	ALTER TABLE ${this.DB_NAME} DROP COLUMN installDir;
			// 	ALTER TABLE ${this.DB_NAME} DROP COLUMN state;
			// 	ALTER TABLE ${this.DB_NAME} ADD COLUMN stared BOOLEAN DEFAULT 0;
			// 	ALTER TABLE ${this.DB_NAME} ADD COLUMN addTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP;
			// `).run()
		} else {
			await this.prepare(`CREATE TABLE ${this.DB_NAME} (
				id INT PRIMARY KEY,
				name VARCHAR(255),
				library TEXT,
				stared BOOLEAN DEFAULT 0,
				installed BOOLEAN DEFAULT 0,
				configured BOOLEAN DEFAULT 0,
				needWrite BOOLEAN DEFAULT 0,
				addTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP
			);`).run();
		}
		await Settings.setNumber(Game.DB_VER_KEY, Game.DB_VER);
	}

	public static async get(id: number): Promise<Game | null> {
		const sql_data = await this.prepare<SQLGame>(
			`SELECT * FROM ${Game.DB_NAME} WHERE id = $id LIMIT 1;`
		).get({ id });

		if (!sql_data) return null;

		return this.createFromSql(sql_data);
	};
	public static async getAll(offset: number = 0, limit: number = 10, search: string | null = null): Promise<Game[]> {
		let sql = `SELECT * FROM ${Game.DB_NAME} `;
		if (search) sql += 'WHERE name LIKE $search ';
		sql += 'ORDER BY stared DESC, installed DESC, configured DESC, addTimestamp DESC, name ASC LIMIT $limit OFFSET $offset;';

		const sql_data = await this.prepare<SQLGame>(sql).getAll({
			offset,
			limit,
			search: search ? `%${search}%` : undefined
		});

		return await Promise.all(sql_data.map(sql_data => this.createFromSql(sql_data)))
	};

	private static async create(id: number, name: string, library: string) {
		const game = new Game();
		game.id = id;
		game.name = name;
		game.library = library;

		await game.checkInstalled();
		await game.checkConfigured();

		return game;
	}

	private static async createFromSql(sql: SQLGame) {
		const game = new Game();
		game.id = sql.id;
		game.name = sql.name;
		game.library = sql.library;

		game.stared = parseBoolean(sql.stared) || false;
		game.addTimestamp = sql.addTimestamp;
		game.installed = parseBoolean(sql.installed) || false;
		game.configured = parseBoolean(sql.configured) || false;
		game.needWrite = parseBoolean(sql.needWrite) || false;

		await game.checkInstalled();
		await game.checkConfigured();

		return game;
	}

	private async checkInstalled() {
		const man = await steam.getAppManifest(this.library, this.id);
		const installed = man ? true : false;
		if (this.installed == installed) return;

		this.installed = installed;
		await this.save();
	}

	private async checkConfigured() {
		if (!this.installed) return;
		const launch_options = await steam.getLaunchOptions(this.id);
		const configured = launch_options == steam.getLaunchPath(this.id);

		if (this.configured == configured || this.needWrite) return;

		this.configured = configured;
		await this.save();
	}

	public toJSON(): IGame {
		return {
			id: this.id,
			name: this.name,
			installed: this.installed,
			configured: this.configured,
			needWrite: this.needWrite,
			stared: this.stared,
			addTimestamp: this.addTimestamp,
			image: this.image
		}
	}

	private async save() {
		await Game.prepare(
			`INSERT OR REPLACE INTO ${Game.DB_NAME} (id, name, stared, addTimestamp, library, installed, configured, needWrite) values ($id, $name, $stared, $addTimestamp, $library, $installed, $configured, $needWrite);`
		).run({
			id: this.id,
			name: this.name,
			stared: this.stared.toString(),
			addTimestamp: this.addTimestamp,
			library: this.library,
			installed: this.installed.toString(),
			configured: this.configured.toString(),
			needWrite: this.needWrite.toString()
		})
	}

	public static async scan() {
		const scan_time = Date.now();
		const libraries = await steam.getLibraries();
		for (const key in libraries) {
			const library = libraries[key];
			for (const s_appId in library.apps) {
				const appId = parseInt(s_appId);
				const app_manifest = await steam.getAppManifest(library.path, appId);
				if (!app_manifest) continue;

				if (await Game.get(appId)) continue;
				const { name } = app_manifest.AppState;
				const game = await Game.create(appId, name, library.path);
				game.addTimestamp = scan_time;
				game.save();
			}
		}
	};

	public static async needWrite() {
		const { c } = await this.prepare<{ c: number }>(`SELECT COUNT(id) as c FROM ${this.DB_NAME} WHERE needWrite = 'true'`).get() || { c: 0 };
		return c > 0;
	};

	public static async write() {
		const steamWasBeenRun = await steam.isRunning();
		await steam.stop();

		const all_games = await this.prepare<SQLGame>(`SELECT * FROM ${this.DB_NAME} WHERE needWrite = 'true';`).getAll().then(e => Promise.all(e.map(e => this.createFromSql(e))));
		const games = all_games.filter(game => game.installed && game.needWrite);
		const { configured, reset } = all_games.reduce((r, game) => {
			r[game.configured ? 'configured' : 'reset'].push(game.id);
			return r;
		}, { configured: [] as number[], reset: [] as number[] });

		const editedIds = [
			...await steam.setLaunchOptions(configured),
			...await steam.resetLaunchOptions(reset),

		];

		await Promise.all(games.map(game => {
			if (editedIds.indexOf(game.id) == -1) return;
			game.needWrite = false;
			return game.save()
		}));

		steamWasBeenRun && await steam.start()
		return editedIds;
	};

	public static async getLaunch() {
		const appId = App.getLaunchApp();
		return (await this.get(appId))?.toJSON();
	}

	public static IPC(_: any, ipc: IPCTunnel) {
		ipc.handle(Messages.getAll, async (offset: number, limit: number, search: string | null) => {
			const games = await Game.getAll(offset, limit, search);
			return games.map(game => game.toJSON());
		})
		ipc.handle(Messages.stared, async (id: number, stared: boolean) => {
			const game = await Game.get(id);
			if (!game) return false;

			game.stared = stared;
			await game.save();

			return game.stared;
		})
		ipc.handle(Messages.scan, () => Game.scan());
		ipc.handle(Messages.configure, async (id: number) => {
			const game = await Game.get(id);
			if (!game) return false;
			game.configured = true;
			game.needWrite = !game.needWrite;
			await game.save();

			return game.configured;
		})
		ipc.handle(Messages.resetConfigure, async (id: number) => {
			const game = await Game.get(id);
			if (!game) return false;
			game.configured = false;
			game.needWrite = !game.needWrite;
			await game.save();
			return !game.configured;
		})

		ipc.handle(Messages.needWrite, () => Game.needWrite());
		ipc.handle(Messages.write, () => Game.write());
		ipc.handle(Messages.getLaunch, () => Game.getLaunch());
	}
};

export default Game;
