import { ipcRenderer as IPCRenderer, contextBridge } from 'electron'

namespace SystemBar {
  export function minimize() {
    IPCRenderer.send("try-minimize");
  }

  export function maximize() {
    IPCRenderer.send("try-maximize");
  }
  export function close() {
    IPCRenderer.send("try-close");
  }

  const changeMaximizedListeners = new Map<number, ChangeMaximizedListener>();
  let changeMaximizedCounter = 0;
  IPCRenderer.on('changeMaximized', (_, value: boolean) => {
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
