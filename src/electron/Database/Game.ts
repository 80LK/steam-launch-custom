import Database from "./Database";
import Settings from "./Settings";
import { GameFilter, IGame, Messages } from "@shared/Game";
import parseBoolean from "@utils/parseBoolean";
import Steam, { TestLaunch } from "../Steam";
import { IPCTunnel } from "../IPCTunnel";
import ImageProtocol from "../Protocol/ImgaeProtocol";
import App from "../App";
import Configure from "../Configure";
import { basename, resolve } from "path";

const steam = Steam.get();

type SQLGame = Pick<IGame, 'id' | 'name'> & { addTimestamp: string; stared: string, installed: boolean, configured: string, library: string, installDir: string, needWrite: string };

class Game extends Database.Model implements IGame {
	public library: string = '';
	private installDir: string = '';
	public get path() {
		return resolve(this.library, "steamapps/common", this.installDir)
	}

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
	private static readonly DB_VER: number = 2;

	private static createTable() {
		return this.prepare(`CREATE TABLE ${this.DB_NAME} (
			id INT PRIMARY KEY,
			name VARCHAR(255),
			library TEXT,
			installDir TEXT,
			stared BOOLEAN DEFAULT 0,
			installed BOOLEAN DEFAULT 0,
			configured BOOLEAN DEFAULT 0,
			needWrite BOOLEAN DEFAULT 0,
			addTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP
		);`).run();
	}
	private static async migrateFromV0() {
		const queries = [
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN stared BOOLEAN DEFAULT 0;`,
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN addTimestamp DATETIME;`,
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN library TEXT;`,
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN installed BOOLEAN DEFAULT 0;`,
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN configured BOOLEAN DEFAULT 0;`,
			`ALTER TABLE ${this.DB_NAME} ADD COLUMN needWrite BOOLEAN DEFAULT 0;`,
		];

		await Promise.all(queries.map(e => this.prepare(e).run()));

		await this.prepare(`UPDATE ${this.DB_NAME} SET addTimestamp = CURRENT_TIMESTAMP;`).run();

		const sql_games = await this.prepare<SQLGame & { state: number }>(`SELECT * FROM ${this.DB_NAME}`).getAll();
		const libraries = await Steam.get().getLibraries();
		function findLibrary(id: string) {
			for (const i in libraries) {
				const library = libraries[i];
				const _id = Object.keys(library.apps).find(e => e == id);
				if (_id == id) return library.path;
			}
			return '';
		}

		await Promise.all(sql_games.map(async game => {
			game.library = findLibrary(game.id.toString());
			game.installDir = basename(game.installDir);
			game.configured = (game.state & 0b100).toString();
			game.needWrite = (game.state & 0b010).toString();
			return (await Game.createFromSql(game)).save()
		}))

		await this.prepare(`ALTER TABLE ${this.DB_NAME} DROP COLUMN state;`).run();
	}
	private static async migrateFromV1() {
		this.run(`ALTER TABLE ${this.DB_NAME} ADD COLUMN installDir TEXT DEFAULT '';`);
		this.run(`UPDATE ${this.DB_NAME} SET addTimestamp = DATETIME(addTimestamp/1000, 'unixepoch') WHERE DATETIME(addTimestamp) IS NULL`);

		const sql_games = await this.prepare<SQLGame & { state: number }>(`SELECT * FROM ${this.DB_NAME} WHERE installed = 'true'`).getAll();
		await Promise.all(sql_games.map(async game => {
			const manifest = await Steam.get().getAppManifest(game.library, game.id);
			if (!manifest) return await this.run(`UPDATE ${this.DB_NAME} SET installed = 'false' WHERE id = $game_id;`, { game_id: game.id });
			return await this.run(`UPDATE ${this.DB_NAME} SET installDir = $installdir WHERE id = $game_id;`, { game_id: game.id, installdir: manifest.appstate.installdir });
		}))
	}

	public static async init() {
		const exsist = await this.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name = $name LIMIT 1;").get({ name: this.DB_NAME });

		if (exsist) {
			const db_ver = await Settings.getNumber(Game.DB_VER_KEY, 0);
			if (db_ver == Game.DB_VER) return;

			switch (db_ver) {
				case 0:
					this.migrateFromV0();
					break;
				case 1:
					this.migrateFromV1();
					break;
			}
		} else {
			this.createTable();
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
	public static async getAll(offset: number | undefined = 0, limit: number | undefined = 10, search: string | null = null, filters: GameFilter = {}): Promise<Game[]> {
		let sql = `SELECT * FROM ${Game.DB_NAME}`;
		const where = [] as string[];


		if (search) where.push('name LIKE $search');
		if (filters.installed) where.push("installed IS 'true'");
		if (filters.configured) where.push("configured IS 'true'");
		if (filters.stared) where.push("stared IS 'true'");

		if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
		sql += ' ORDER BY stared DESC, installed DESC, configured DESC, addTimestamp DESC, name ASC';
		if (limit != null) sql += ' LIMIT $limit';
		if (offset != null) sql += ' OFFSET $offset';
		sql += ';';

		const sql_data = await this.prepare<SQLGame>(sql).getAll({
			offset,
			limit,
			search: search ? `%${search}%` : undefined
		});

		return await Promise.all(sql_data.map(sql_data => this.createFromSql(sql_data)))
	};

	private static async create(id: number, name: string, library: string, installDir: string) {
		const game = new Game();
		game.id = id;
		game.name = name;
		game.library = library;
		game.installDir = installDir;

		await game.checkInstalled();
		await game.checkConfigured();

		return game;
	}

	private static async createFromSql(sql: SQLGame) {
		const game = new Game();
		game.id = sql.id;
		game.name = sql.name;
		game.library = sql.library;
		game.installDir = sql.installDir;

		game.stared = parseBoolean(sql.stared) || false;
		game.addTimestamp = new Date(sql.addTimestamp).getTime();
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

	private async checkNeedWrite() {
		const test = await steam.testLaunchPath(this.id);

		if (this.configured && this.needWrite && test == TestLaunch.CURRENT) {
			return false;
		} else if (this.configured && !this.needWrite && test != TestLaunch.CURRENT) {
			return true;
		} else if (!this.configured && this.needWrite && test == TestLaunch.NO) {
			return false;
		} else if (!this.configured && !this.needWrite && test != TestLaunch.NO) {
			return true;
		}

		return this.needWrite;
	}

	private async checkConfigured() {
		if (!this.installed) return;
		const old_needWrite = this.needWrite;

		this.needWrite = await this.checkNeedWrite();

		if (old_needWrite != this.needWrite)
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

	public async save() {
		Configure.editGame(this);
		await Game.prepare(
			`INSERT OR REPLACE INTO ${Game.DB_NAME} (id, name, stared, addTimestamp, library, installed, configured, needWrite, installDir) values ($id, $name, $stared, DATETIME($addTimestamp/1000, 'unixepoch'), $library, $installed, $configured, $needWrite, $installDir);`
		).run({
			id: this.id,
			name: this.name,
			stared: this.stared.toString(),
			addTimestamp: this.addTimestamp,
			library: this.library,
			installDir: this.installDir,
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
				const { name, installdir } = app_manifest.appstate;
				const game = await Game.create(appId, name, library.path, installdir);
				game.addTimestamp = scan_time;
				game.save();
			}
		}
	};

	public static async needWrite() {
		return await this.prepare<SQLGame>(`SELECT * FROM ${this.DB_NAME} WHERE needWrite = 'true';`).getAll().then(e => Promise.all(e.map(e => this.createFromSql(e))));
	};

	public static async write() {
		const steamWasBeenRun = await steam.isRunning();
		await steam.stop();

		const all_games = await this.needWrite();
		const games = all_games.filter(game => game.installed && game.needWrite);
		const { configured, reset } = all_games.reduce((r, game) => {
			r[game.configured ? 'configured' : 'reset'].push(game.id);
			return r;
		}, { configured: [] as number[], reset: [] as number[] });

		const editedIds = [
			...await steam.setLaunchOptions(configured),
			...await steam.resetLaunchOptions(reset),
		];

		if (await steam.writeLocalConfig())
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
		ipc.handle(Messages.getAll, async (offset: number, limit: number, search: string | null, filter: GameFilter) => {
			const games = await Game.getAll(offset, limit, search, filter);
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
			if (!game) return null;

			game.configured = true;
			game.needWrite = await game.checkNeedWrite();
			await game.save();

			return game.toJSON();
		})
		ipc.handle(Messages.resetConfigure, async (id: number) => {
			const game = await Game.get(id);
			if (!game) return null;

			game.configured = false;
			game.needWrite = await game.checkNeedWrite();
			await game.save();
			return game.toJSON();
		})

		ipc.handle(Messages.needWrite, () => Game.needWrite());
		ipc.handle(Messages.write, () => Game.write());
		ipc.handle(Messages.getLaunch, () => Game.getLaunch());
	}
};

export default Game;
