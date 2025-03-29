import vue from "@vitejs/plugin-vue";
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'
import defineElectronConfig from "@80lk/vite-plugin-electron";
import { resolve } from "path";

const root = __dirname;
const src = resolve(root, 'src');
const front = resolve(src, 'front');
const preload = resolve(src, 'electron-preload');
const electron = resolve(src, 'electron');
const distFolder = resolve(root, 'dist');

const globalAliases = {
	"@utils": resolve(src, 'utils'),
	"@shared": resolve(src, 'shared'),
}

export default defineElectronConfig(
	//Electron
	{
		main: resolve(electron, 'index.ts'),
		preload: resolve(preload, 'main.ts'),
		outDir: resolve(root, 'dist-electron'),
		declarationPreload: resolve(front, 'preload-env.d.ts'),

		// Vite
		resolve: {
			alias: globalAliases,
			extensions: [
				".ts"
			]
		},
		define: {
			// @see - https://github.com/vitejs/vite/blob/v5.0.11/packages/vite/src/node/plugins/define.ts#L20
			'process.env': 'process.env',
		},
	},
	//Front-app
	{
		label: "Front-app",
		root: front,
		base: './',
		resolve: {
			alias: Object.assign(
				globalAliases,
				{
					"@locales": resolve(front, "locales"),
					"@components": resolve(front, "components"),
					"@store": resolve(front, "store"),
				}
			),
			extensions: [
				".ts",
				".vue"
			]
		},
		publicDir: resolve(root, 'public'),
		build: {
			target: "ES2022",
			emptyOutDir: true,
			rollupOptions: {
				input: {
					main: resolve(front, 'index.html'),
					launch: resolve(front, 'launch.html')
				},
			},
			outDir: distFolder,
		},
		plugins: [
			vue(),
			vuetify({
				styles: {
					configFile: resolve(front, "vuetify.scss")
				}
			}),
			vueDevTools(),
			VueI18nPlugin()
		],
	}
);
