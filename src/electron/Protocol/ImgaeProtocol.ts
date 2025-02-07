import { net } from "electron";
import { resolve } from "path";
import Protocol from "./Protocol";
import Steam from "../Steam";
import { IGame } from "@shared/Game";
import exsist from "@utils/exists";
import { pathToFileURL } from "url";
import { glob } from "glob";
import { ILaunch } from "@shared/Launch";
import { getAppDataFilePath } from "../consts";

const steam = Steam.get();

type ImageProtocolHandler = (...args: string[]) => Promise<string> | string;

class ImageProtocol extends Protocol {
	private static readonly ICON_CACHE = getAppDataFilePath('cache', true);


	private constructor() {
		super("slc-image");
	}

	private async getHeader(id: string) {
		const lastUser = await steam.getLastUserId();
		if (lastUser) {
			const userdata = resolve(
				steam.path,
				"userdata",
				lastUser.toString(),
				"config/grid"
			);

			const header_custom = await glob(`${id}_hero.{png,jpeg,jpg}`, { cwd: userdata });
			if (header_custom.length) return resolve(userdata, header_custom[0]);
		}

		const librarycache = resolve(steam.path, "appcache/librarycache");

		const header = await glob(`${id}{_,/**/}header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (header.length) return resolve(librarycache, header[0]);

		const library_header = await glob(`${id}{_,/**/}library_header.{png,jpeg,jpg}`, { cwd: librarycache });
		if (library_header.length) return resolve(librarycache, library_header[0]);

		const library_hero = await glob(`${id}{_,/**/}library_hero.{png,jpeg,jpg}`, { cwd: librarycache });
		if (library_hero.length) return resolve(librarycache, library_hero[0]);

		return resolve(steam.path, "tenfoot/resource/images/bootstrapper.jpg");
	}

	public static getFileIcon(game_id: number | string, id: number | string) {
		return resolve(ImageProtocol.ICON_CACHE, `${game_id}_${id}.ico`);
	}

	private async getIcon(game_id: string, id: string) {
		const image_path = ImageProtocol.getFileIcon(game_id, id);
		if (await exsist(image_path)) return image_path;

		return resolve(
			steam.path,
			'public/steam_tray.ico'
		)
	}



	private typeMaps: Record<string, ImageProtocolHandler> = {};
	public addType(type: string, callback: ImageProtocolHandler) {
		this.typeMaps[type] = callback;
	}

	public async handle(request: GlobalRequest): Promise<GlobalResponse> {
		const image = request.url.slice((this.protocol + '://').length);
		const [type, ...args] = image.split('_');

		const placeholder = resolve(steam.path, "tenfoot/resource/images/bootstrapper.jpg");
		let image_path = placeholder;
		if (type == ImageProtocol.HEADER) {
			const [id] = args;
			image_path = await this.getHeader(id);
		} else if (type == ImageProtocol.ICON) {
			const [gameId, id] = args;
			image_path = await this.getIcon(gameId, id);
		}
		const custom = this.typeMaps[type];
		if (custom) image_path = await custom(...args);
		if (!await exsist(image_path))
			image_path = placeholder;

		return net.fetch(pathToFileURL(image_path).toString())
	}

	private static _instance: ImageProtocol;
	public static get() {
		if (!this._instance) this._instance = new ImageProtocol();
		return this._instance;
	}
	private static HEADER = "header";
	private static ICON = "icon";
	public static getHeader(game: IGame) {
		const protocol = this.get();
		return `${protocol.protocol}://${this.HEADER}_${game.id}`;
	}

	public static getIcon(launch: ILaunch) {
		const protocol = this.get();
		return `${protocol.protocol}://${this.ICON}_${launch.game_id}_${launch.id}`;
	}
}

export default ImageProtocol;
