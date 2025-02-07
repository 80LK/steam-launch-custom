import { PathLike } from "fs";
import { stat } from "fs/promises";
type FSType = 'file' | 'dir';

async function exsist(path: PathLike, type: FSType = 'file') {
	try {
		const s = await stat(path);
		if (type == "dir") return s.isDirectory();
		if (type == 'file') return s.isFile();
		return false;
	} catch (e) {
		return false;
	}
}

export default exsist;
