import { ipcRenderer as IPCRenderer, contextBridge } from 'electron'
import InitState from '../SteamInitState';
import IPCMessages from './IPCMessages';
import IConfig from '../IConfig';

namespace SystemBar {

  export function minimize() {
    IPCRenderer.send(IPCMessages.SystemBar.minimize);
  }

  export function maximize() {
    IPCRenderer.send(IPCMessages.SystemBar.maximize);
  }
  export function close() {
    IPCRenderer.send(IPCMessages.SystemBar.close);
  }

  export interface ChangeMaximizedListener {
    (maximized: boolean): void;
  };
  const changeMaximizedListeners = new Map<number, ChangeMaximizedListener>();
  let changeMaximizedCounter = 0;
  IPCRenderer.on(IPCMessages.SystemBar.changeMaximized, (_, value: boolean) => {
    changeMaximizedListeners.forEach(e => e(value));
  })
  export function onChangeMaximized(listener: ChangeMaximizedListener) {
    changeMaximizedListeners.set(++changeMaximizedCounter, listener);
    return changeMaximizedCounter;
  };
  export function offChangeMaximized(listener: number) {
    changeMaximizedListeners.delete(listener);
  };

}
contextBridge.exposeInMainWorld('SystemBar', SystemBar);
type NSystemBar = typeof SystemBar;
declare global {
  const SystemBar: NSystemBar;
}



namespace Steam {
  export async function getCurrentState(): Promise<{ state: InitState, message: string }> {
    return await IPCRenderer.invoke(IPCMessages.Steam.getCurrentState);
  }

  export interface ChangeInitStateListener {
    (state: InitState, message: string): void;
  }
  const changeInitStateListeners = new Map<number, ChangeInitStateListener>();
  let changeInitStateCounter = 0;
  IPCRenderer.on(IPCMessages.Steam.changeInitState, (_, state: InitState, message: string) => {
    changeInitStateListeners.forEach(e => e(state, message));
  })
  export function onChangeInitState(listener: ChangeInitStateListener) {
    changeInitStateListeners.set(++changeInitStateCounter, listener);
    return changeInitStateCounter;
  };
  export function offChangeInitState(listener: number) {
    changeInitStateListeners.delete(listener);
  };
}
contextBridge.exposeInMainWorld('Steam', Steam);
type NSteam = typeof Steam;
declare global {
  const Steam: NSteam;
}

namespace Config {
  export async function get() {
    const cfg: IConfig = await IPCRenderer.invoke(IPCMessages.Config.get);
    return cfg;
  }

  export function edit<T extends keyof IConfig>(field: T, value: IConfig[T]) {
    IPCRenderer.send(IPCMessages.Config.edit, field, value);
  }
}
contextBridge.exposeInMainWorld('Config', Config);
type NConfig = typeof Config;
declare global {
  const Config: NConfig;
}
