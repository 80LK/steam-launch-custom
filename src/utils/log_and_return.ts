function log<T>(a: T, ...args: any[]): T {
	console.log(...args, a);
	return a;
}

export default log;
