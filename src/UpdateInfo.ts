enum UpdateState {
	NO,
	YES,
	DOWNLOADED
}


interface UpdateInfo {
	version: string | null;
	state: UpdateState;
}

export type { UpdateInfo };
export { UpdateState };
