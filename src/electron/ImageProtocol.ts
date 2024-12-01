import { net } from "electron";
import IGame from "../IGame";
import ILaunch from "../ILaunch";
import Launch from "./Launch/Launch";
import Protocol from "./Protocol";
import path from "path";
import url from "url";
import Config from "./Config/Config"
import Steam from "./Steam/Steam"
import { globSync } from "glob";
import { existsSync } from "fs";

class ImageProtocol extends Protocol {
	private constructor() {
		super("slc-image");
	}

	private getHeader(id: string) {
		const CFG = Config.getInstance();
		const userdata = path.join(
			CFG.steamPath,
			"userdata",
			Steam.getLastUserId().toString(),
			"config/grid"
		);


		const header_custom = globSync(`${id}_hero.{png,jpeg,jpg}`, { cwd: userdata });
		if (header_custom.length) return path.join(userdata, header_custom[0]);

		const librarycache = path.join(CFG.steamPath, "appcache/librarycache");

		const header = globSync(`${id}_header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (header.length) return path.join(librarycache, header[0]);

		const library_header = globSync(`${id}_library_header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (library_header.length) return path.join(librarycache, library_header[0]);

		return path.join(CFG.steamPath, "tenfoot/resource/images/bootstrapper.jpg");
	}

	private getIcon(game_id: string, id: string) {
		const image_path = path.resolve(Launch.ICON_CAHCE, `${game_id}_${id}.ico`)
		if (existsSync(image_path)) return image_path;

		return path.join(
			Config.getInstance().steamPath,
			'public/steam_tray.ico'
		)
	}



	private typeMaps: Record<string, (...args: string[]) => string> = {};
	public addType(type: string, callback: (...args: string[]) => string) {
		this.typeMaps[type] = callback;
	}

	public handle(request: GlobalRequest): Promise<GlobalResponse> | GlobalResponse {
		const image = request.url.slice((this.protocol + '://').length);
		const [type, ...args] = image.split('_');

		const placeholder = path.join(Config.getInstance().steamPath, "tenfoot/resource/images/bootstrapper.jpg");
		let image_path = placeholder;
		if (type == ImageProtocol.HEADER) {
			const [id] = args;
			image_path = this.getHeader(id);
		} else if (type == ImageProtocol.ICON) {
			const [gameId, id] = args;
			image_path = this.getIcon(gameId, id);
		}
		const custom = this.typeMaps[type];
		if (custom) image_path = custom(...args);
		if (!existsSync(image_path))
			image_path = placeholder;

		return net.fetch(url.pathToFileURL(image_path).toString())
	}

	private static _instance: ImageProtocol;
	public static getInstance() {
		if (!this._instance) this._instance = new ImageProtocol();
		return this._instance;
	}
	private static HEADER = "header";
	private static ICON = "icon";
	public static getHeader(game: IGame) {
		const protocol = this.getInstance();
		return `${protocol.protocol}://${this.HEADER}_${game.id}`;
	}

	public static getIcon(launch: ILaunch) {
		const protocol = this.getInstance();
		return `${protocol.protocol}://${this.ICON}_${launch.game_id}_${launch.id}`;
	}
}

export default ImageProtocol;
