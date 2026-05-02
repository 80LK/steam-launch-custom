import { resolve } from "path";
import { DEV, ROOT, RESOURCES, getAppDataFilePath, require } from "./consts";
import type { ProcessInfo } from "../shared/ProcessList"
import { spawn } from "child_process";
import Logger from "./Logger";
import ImageProtocol from "./Protocol/ImageProtocol";
import exsist from "@utils/exists";
import extractIcon from "./extractIcon";
const sharp = require('sharp') as typeof import('sharp');

namespace ProcessList {
	const EXECUTABLE = resolve(DEV ? ROOT : RESOURCES, "process_list/process_list.exe");
	const ICON_CACHE = getAppDataFilePath('cache/pl', true);

	ImageProtocol.get().addType("process", async (name: string) => {
		const image_path = resolve(ICON_CACHE, `${name}.png`);
		if (await exsist(image_path)) return image_path;

		throw "NOT_FOUND"
	})

	function generateIcon(list: ProcessInfo[]) {
		return Promise.all(list.map(async process => {
			if (process.childs && process.childs.length > 0)
				await generateIcon(process.childs)


			const file = resolve(ICON_CACHE, `${process.name}.png`);
			if (await exsist(file)) return;

			const buf = extractIcon(process.execute)
			return new Promise<void>(r => sharp(buf).resize(64).toFormat('png').toFile(file, () => r()))
		}))
	}

	export async function getList(): Promise<ProcessInfo[]> {
		try {
			const list = await new Promise<ProcessInfo[]>((r, c) => {
				const proc = spawn(EXECUTABLE, ['-f', 'json', '-t']);
				var plist_raw = ''
				proc.on('close', () => {
					r(JSON.parse(plist_raw))
				})
				proc.on('err', (err) => {
					c(err)
				})
				proc.stdout.on('data', chunk => plist_raw += chunk.toString())
			})

			await generateIcon(list)

			return list
		} catch (err: any) {
			Logger.error("Error: " + err.toString(), { prefix: 'PLIST' })
		}
		return []
	}
}

export default ProcessList
