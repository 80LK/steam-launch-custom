import { contextBridge } from 'electron'
import App from './App';
import SystemBar from './SystemBar';
import Settings from './Settings';

contextBridge.exposeInMainWorld('App', App);
contextBridge.exposeInMainWorld('SystemBar', SystemBar);
contextBridge.exposeInMainWorld('Settings', Settings);
