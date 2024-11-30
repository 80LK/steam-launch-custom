import { contextBridge } from 'electron'

import PreloadApp from "./App/Preload";
import PreloadSystemBar from "./SystemBar/Preload";
import PreloadConfig from "./Config/Preload";
import PreloadGame from "./Game/Preload";
import PreloadLaunch from "./Launch/Preload";
import PreloadSteam from "./Steam/Preload";

contextBridge.exposeInMainWorld('App', PreloadApp);
contextBridge.exposeInMainWorld('Config', PreloadConfig);
contextBridge.exposeInMainWorld('SystemBar', PreloadSystemBar);
contextBridge.exposeInMainWorld('Game', PreloadGame);
contextBridge.exposeInMainWorld('Launch', PreloadLaunch);
contextBridge.exposeInMainWorld('Steam', PreloadSteam);
