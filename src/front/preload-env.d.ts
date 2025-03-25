declare global {
	const App: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/App').default;
	const SystemBar: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/SystemBar').default;
	const Settings: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Settings').default;
	const Game: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Game').default;
	const Launch: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Launch').default;
	const Updater: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Updater').default;
	const Steam: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Steam').default;
	const Logger: typeof import('D:/dev/electron/steam-launch-custom/src/electron-preload/Logger').default;
}
export {};
