import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
// import { existsSync, mkdirSync } from "fs";

export const require = createRequire(import.meta.url)

export const dirname = path.dirname(fileURLToPath(import.meta.url))
export const APP_ROOT = path.join(dirname, '..')

export const DATABASE_PATH = path.join(APP_ROOT, "db");

// export const CACHE_ICON_PATH = path.join(APP_ROOT, "cache");
// if (!existsSync(CACHE_ICON_PATH)) mkdirSync(CACHE_ICON_PATH);


export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
// export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(APP_ROOT, 'dist')
export const PUBLIC_PATH = path.join(APP_ROOT, "public");
