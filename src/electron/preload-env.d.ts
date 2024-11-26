/// <reference types="vite-plugin-electron/electron-env" />

interface ChangeMaximizedListener {
  (maximized: boolean): void;
}
namespace SystemBar {
  function close(): void;
  function minimize(): void;
  function maximize(): void;
  function onChangeMaximized(listener: ChangeMaximizedListener): number;
  function offChangeMaximized(listener: number): void;
}
