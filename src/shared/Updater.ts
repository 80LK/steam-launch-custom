enum Messages {
	check = "updater.check",
	download = "updater.download",
	install = 'updater.install'
}

type CheckResult = { state: UpdateState; version: string; }

enum UpdateState {
	NO = 'no',
	HAVE = 'have',
	DOWNLOADED = 'downloaded',

	INIT = 'init',
	CHECK = 'check',
	DOWNLOADING = 'downloading'
}

export { Messages, UpdateState, type CheckResult };
