import Service from "./Service";
import path from "path";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import type sqlite3 from "sqlite3";
import { RunResult as SQLRunResult, type Statement as SQLStatement, type Database as SQLite } from "sqlite3";
import { APP_ROOT } from "./consts";
const sqlite: typeof sqlite3 = require('sqlite3');


type DataBinding = number | string | bigint | null | Buffer;
type ParamsBinding = Record<string, DataBinding>;
interface RunResult {
	lastID: number;
	changes: number;
}

interface DatabaseDebug {
	memory: boolean;
	logSql: boolean;
}
const INIT_DATABASE_DEBUG: () => DatabaseDebug = () => ({
	memory: false,
	logSql: false
});

type DatabaseDebugOptions = Partial<DatabaseDebug>;
class Database extends Service {
	private static readonly DATABASE_PATH = path.join(APP_ROOT, "db");
	private static _debug: DatabaseDebug = INIT_DATABASE_DEBUG();

	public static debug(options: DatabaseDebugOptions = { logSql: true }) {
		this._debug = Object.assign(INIT_DATABASE_DEBUG(), options);
		return this;
	}

	private _db: SQLite;
	private constructor() {
		super("Database");
		this._db = new sqlite.Database(Database._debug.memory ? ":memory:" : Database.DATABASE_PATH);
		Database._debug.logSql && this._db.on('trace', (sql) => console.log("[SQL]:", sql));
	}

	protected async _init(): Promise<void> {
		for (const model of Database._models) {
			this.setState(`Initalization model ${model.name}`)
			await model.init();
		}
	}

	public prepare<T>(sql: string, params?: Record<string, any>) {
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

	private static _models: typeof Database.Model[];
	public static init(...models: typeof Database.Model[]) {
		const DB = this.getInstance();
		this._models = models;
		return DB;
	}

	private static _instance: Database;
	public static getInstance() {
		if (!this._instance) this._instance = new Database();
		return this._instance;
	}
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

	export abstract class Model {
		public static name: string = "Model";

		public static prepare<T>(sql: string, params?: Record<string, any>) {
			return Database.getInstance().prepare<T>(sql, params);
		}

		protected static run(sql: string, params?: ParamsBinding) {
			return this.prepare(sql).run(params);
		}

		protected static get<T>(sql: string, params?: ParamsBinding) {
			return this.prepare<T>(sql).get(params)
		}
		protected static getAll<T>(sql: string, params?: ParamsBinding) {
			return this.prepare<T>(sql).getAll(params)
		}

		public static init(): Promise<void> | void {
			throw new Error("Method not implemented.");
		}
	}

}

export default Database;
export type { DataBinding, ParamsBinding, RunResult };
