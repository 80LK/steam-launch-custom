enum Messages {
	changeInitState = 'app.changeInitState',
	getCurrentState = 'app.getCurrentState',
	selectFile = 'app.selectFile',
	getAppData = 'app.getAppData',
	openExplorer = 'app.openExplorer',
	openUrl = 'app.openUrl'
}

export { Messages };


enum State {
	INIT = "init",
	ERROR = "error",
	READY = "ready"
}
type StateMessage = {
	state: State,
	message: string
}

export { State, type StateMessage };


type FileType = 'directory' | { name: string, extensions: string[] };
export { type FileType }
