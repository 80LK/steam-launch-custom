enum Messages {
	check = "updater.check",
	download = "updater.download",
	install = 'updater.install'
}

type CheckResult = { state: UpdateState; version: string; }

function isCheckResult(a: any): a is CheckResult {
	return typeof a == "object" && a.hasOwnProperty('state') && a.hasOwnProperty('version');
}

enum UpdateState {
	NO = 'no',
	HAVE = 'have',
	DOWNLOADED = 'downloaded',

	INIT = 'init',
	CHECK = 'check',
	DOWNLOADING = 'downloading'
}

const CHECK_PRERELEASE_KEY = "check_prerelease";

export { Messages, UpdateState, type CheckResult, isCheckResult, CHECK_PRERELEASE_KEY };
