import { createWriteStream, existsSync, renameSync, WriteStream } from "fs";
import { IInitialable } from "./App";
import { IPCTunnel } from "./IPCTunnel";
import { getAppDataFilePath } from "./consts";
import { Messages } from "@shared/Logger";

interface LogOption {
	prefix?: string;
}

class Logger implements IInitialable {
	private static readonly FILE = getAppDataFilePath('logs/log.txt');
	private static readonly FILE_BCK = getAppDataFilePath('logs/log.txt.bck');
	private stream?: WriteStream;

	public async init(message: (msg: string) => void): Promise<void> {
		message("init.logger");

		if (existsSync(Logger.FILE)) renameSync(Logger.FILE, Logger.FILE_BCK);

		this.stream = createWriteStream(Logger.FILE, {
			encoding: "utf-8"
		});
	}

	public static _instance: Logger;
	public static get() {
		if (!this._instance)
			this._instance = new Logger()
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
		ipc.on(Messages.log, (message: string) => this.get().log(message, { prefix: "RENDERER" }));
		ipc.on(Messages.error, (message: string) => this.get().error(message, { prefix: "RENDERER" }));
	}
}

export default Logger;
