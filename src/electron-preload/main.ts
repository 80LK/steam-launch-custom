import { contextBridge } from 'electron'
import App from './App';
import SystemBar from './SystemBar';
import Settings from './Settings';
import Game from './Game';
import Launch from './Launch';
import Updater from './Updater';

contextBridge.exposeInMainWorld('App', App);
contextBridge.exposeInMainWorld('SystemBar', SystemBar);
contextBridge.exposeInMainWorld('Settings', Settings);
contextBridge.exposeInMainWorld('Game', Game);
contextBridge.exposeInMainWorld('Launch', Launch);
contextBridge.exposeInMainWorld('Updater', Updater);
