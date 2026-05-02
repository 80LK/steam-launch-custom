export interface ProcessInfo {
	pid: number;
	ppid: number;
	name: string;
	execute: string;
	workDir: string;
	argv: string[];
	childs: ProcessInfo[];
}
