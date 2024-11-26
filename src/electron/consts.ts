import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

export const require = createRequire(import.meta.url)

export const dirname = path.dirname(fileURLToPath(import.meta.url))

export const APP_ROOT = path.join(dirname, '..')
export const CONFIG_DIST = path.join(APP_ROOT, 'cfg');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')
export const MODULES_PATH = path.join(APP_ROOT, "modules");
export const PUBLIC_PATH = path.join(APP_ROOT, "public");
