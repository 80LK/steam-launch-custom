import { createWriteStream, existsSync, renameSync, WriteStream } from "fs";
import { IInitialable } from "./App";
import { IPCTunnel } from "./IPCTunnel";
import { getAppDataFilePath } from "./consts";
import { Messages } from "@shared/Logger";
import { resolve } from "path";

interface LogOption {
	prefix?: string;
}

class Logger implements IInitialable {
	private static readonly DEFAULT_FILE = 'log.txt';
	private static readonly DIR = getAppDataFilePath('logs');
	private static readonly BCK_EXT = '.bck';
	private stream?: WriteStream;

	private file: string;
	private constructor(file: string) {
		this.file = resolve(Logger.DIR, file);
	}

	public async init(message: (msg: string) => void): Promise<void> {
		message("init.logger");

		if (existsSync(this.file)) renameSync(this.file, this.file + Logger.BCK_EXT);

		this.stream = createWriteStream(this.file, { encoding: "utf-8" });
	}

	public static _instance: Logger;
	public static get(file: string = Logger.DEFAULT_FILE) {
		if (!this._instance) this._instance = new Logger(file);
		return this._instance;
	}

	public _write(type: string, message: string, { prefix }: LogOption) {
		let str = `[${new Date().toLocaleString()}] [${type.toUpperCase()}] `;
		if (prefix) str += `[${prefix}] `;

		str += message;

		console.log(str);
		this.stream?.write(str + "\r\n");

	}

	public log(message: string, opt: LogOption = {}) {
		this._write('log', message, opt);
	}
	public static log(message: string, opt?: LogOption) {
		this.get().log(message, opt)
	}

	public error(message: string, opt: LogOption = {}) {
		this._write('error', message, opt);
	}
	public static error(message: string, opt?: LogOption) {
		this.get().error(message, opt)
	}

	public static IPC(_: any, ipc: IPCTunnel) {
		ipc.on(Messages.log, (message: string) => Logger.log(message, { prefix: "RENDERER" }));
		ipc.on(Messages.error, (message: string) => Logger.error(message, { prefix: "RENDERER" }));
	}
}

export default Logger;
