import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

export const require = createRequire(import.meta.url)

export const dirname = path.dirname(fileURLToPath(import.meta.url))
export const ASAR_ROOT = path.join(dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const DEV = !!VITE_DEV_SERVER_URL;
export const RENDERER_DIST = path.join(ASAR_ROOT, 'dist')
export const PUBLIC_PATH = path.join(ASAR_ROOT, "public");

export const APP_ROOT = ASAR_ROOT.indexOf('.asar') == -1 ? ASAR_ROOT : path.join(ASAR_ROOT, '../..');
