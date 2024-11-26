namespace IPCMessages {
	export enum SystemBar {
		minimize = 'systembar.minimize',
		maximize = 'systembar.maximize',
		close = 'systembar.close',
		changeMaximized = 'systembar.changeMaximized'
	}

	export enum Steam {
		changeInitState = 'steam.changeInitState',
		getCurrentState = 'steam.getCurrentState',
	}

	export enum Config {
		get = 'config.get',
		edit = 'config.edit',
	}
}

export default IPCMessages;
