const IS_TRUE = ['t', 'true', 'y', 'yes', '1'];
const IS_FALSE = ['f', 'false', 'n', 'no', '0'];

function parseBoolean(value: any): boolean | null {
	if (/^(\d*\.)?\d+$/.test(value))
		value = parseFloat(value);

	switch (typeof value) {
		case "number":
			return value != 0;
		case "string":
			value = value.toLowerCase();
			if (IS_TRUE.indexOf(value) != -1) return true;
			if (IS_FALSE.indexOf(value) != -1) return false;
			return null;
		case "boolean":
			return value;
	}

	return null;
}

export default parseBoolean;
