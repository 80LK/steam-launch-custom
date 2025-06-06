import { getAppDataFilePath, require } from "../consts";
import { IInitialable } from "../App";
import { default as sqlite3, Database as SQLite, Statement as SQLStatement, RunResult as SQLRunResult } from "sqlite3";
import EventEmitter from "events";
import Logger from "../Logger";
const sqlite = require('sqlite3') as typeof sqlite3;

interface DatabaseDebug {
	memory: boolean;
	logSql: boolean;
}
type DatabaseDebugOptions = Partial<DatabaseDebug>;
const INIT_DATABASE_DEBUG: () => DatabaseDebug = () => ({
	memory: false,
	logSql: false
});

class Database implements IInitialable {
	private _db: SQLite;
	private _emmiter = new EventEmitter();
	private constructor(readonly: boolean = false) {
		this._db = new sqlite.Database(Database._debug.memory ? ":memory:" : Database.DATABASE_PATH, readonly ? sqlite.OPEN_READONLY : undefined);
		Database._debug.logSql && this._db.on('trace', (sql) => Logger.log(sql, { prefix: "SQL" }));
	}

	private _models = new Set<typeof Database.Model>();
	public register(model: typeof Database.Model, ...models: typeof Database.Model[]): this;
	public register(...models: typeof Database.Model[]) {
		models.forEach(model => this._models.add(model));
		return this;
	}

	// SQL
	public prepare<T>(sql: string, params?: ParamsBinding) {
		const statement = new Database.Statement<T>(this._db.prepare(sql));
		params && statement.bind(params);
		return statement;
	}

	public run(sql: string, params?: ParamsBinding) {
		return this.prepare(sql).run(params)
	}

	public get<T>(sql: string, params?: ParamsBinding) {
		return this.prepare<T>(sql).get(params)
	}
	public getAll<T>(sql: string, params?: ParamsBinding) {
		return this.prepare<T>(sql).getAll(params)
	}

	public awaitModel(model: typeof Database.Model) {
		let test: (...args: any[]) => void;
		return new Promise<void>(r => this._emmiter.on("init", test = (inited: typeof Database.Model) => {
			if (inited !== model) return;
			r();
			this._emmiter.off('init', test);
		}))
	}

	// IInitialable	
	public async init(state: (msg: string) => void): Promise<void> {
		state('init.database');
		for (const model of this._models) {
			await model.init()
			this._emmiter.emit('init', model);
		}
		return;
	}


	private static readonly DATABASE_PATH = getAppDataFilePath("db");
	private static _debug: DatabaseDebug = INIT_DATABASE_DEBUG();
	public static debug(options: DatabaseDebugOptions = { logSql: true }) {
		this._debug = Object.assign(INIT_DATABASE_DEBUG(), options);
		return this;
	}

	private static _instance: Database;
	public static get(readonly: boolean = false) {
		if (!this._instance) this._instance = new Database(readonly);
		return this._instance;
	}
}

type DataBinding = number | string | bigint | null | Buffer | undefined;
type ParamsBinding = Record<string, DataBinding>;
interface RunResult {
	lastID: number;
	changes: number;
}


namespace Database {
	export class Statement<T> {
		private _statement: SQLStatement;
		constructor(statement: SQLStatement) {
			this._statement = statement;
		}

		public bind(params: ParamsBinding) {
			let binds: ParamsBinding = {};
			for (const key in params) {
				binds[`$${key}`] = params[key];
			}
			this._statement.bind(binds);
			return this;
		}

		public run(params?: ParamsBinding) {
			params && this.bind(params);
			return new Promise<RunResult>((resolve, reject) => {
				this._statement.run(function (this: SQLRunResult, err) {
					if (err) return reject(err);
					resolve({
						lastID: this.lastID,
						changes: this.changes
					})
				})
			});
		}

		public get(params?: ParamsBinding) {
			params && this.bind(params);
			return new Promise<T | null>((resolve, reject) => {
				this._statement.get<T>((err: Error | null, row: T | undefined) => {
					if (err) return reject(err);
					resolve(row ?? null);
				})
			});
		}

		public getAll(params?: ParamsBinding) {
			params && this.bind(params);
			return new Promise<T[]>((resolve, reject) => {
				this._statement.all<T>((err: Error | null, rows: T[]) => {
					if (err) return reject(err);
					resolve(rows);
				});
			});

		}
	}

	export class Model {
		public static run<T>(sql: string, params?: ParamsBinding) {
			return Database.get().prepare<T>(sql).run(params)
		}

		public static prepare<T>(sql: string, params?: ParamsBinding) {
			return Database.get().prepare<T>(sql, params);
		}

		public static init(): Promise<void> {
			throw new Error("Method not implemented.");
		}
	}
}

export default Database;
