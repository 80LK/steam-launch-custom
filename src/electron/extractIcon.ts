import type EventEmitter from "events";
import { require } from "./consts";
type iconExtractor = {
	emitter: EventEmitter;
	getIcon(Context: string, Path: string): void;
}
const iconExtractor: iconExtractor = require("icon-extractor");

let extractId = 0;
function extractIcon(path: string) {
	const _extractId = `icon-${extractId++}`;
	return new Promise<Buffer>((r) => {
		function callback({ Context, Base64ImageData }: { Context: string, Path: string, Base64ImageData: string }) {
			if (Context !== _extractId) return;
			iconExtractor.emitter.off('icon', callback);
			r(Buffer.from(Base64ImageData, 'base64'));
		}
		iconExtractor.emitter.on('icon', callback);
		iconExtractor.getIcon(_extractId, path);
	})
}

export default extractIcon;
