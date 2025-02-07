import { require } from "./consts";
import extarct from "extract-file-icon";
const extract: typeof extarct = require('extract-file-icon');

const sizes: [64, 256, 32, 16] = [64, 256, 32, 16];
function extractIcon(path: string) {
	for (const size of sizes) {
		const buffer = extract(path, size);
		if (buffer.length > 0) return buffer;
	}
}

export default extractIcon;
