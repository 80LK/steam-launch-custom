import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = process.cwd();

  return {
    build: {
      target: "ES2022"
    },
    plugins: [
      vue(),
      vuetify(),
      vueDevTools(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: 'src/electron/main.ts',
          onstart({ startup }) {
            const env = loadEnv(mode, cwd, '');
            const args = [cwd];
            if (mode == "launch") {
              const id = env.LAUNCH_ID;
              if (!id) {
                console.error("LAUNCH_ID not set in env");
              } else {
                const exe = env.LAUNCH_EXECUTE;
                if (!exe)
                  console.error("LAUNCH_EXECUTE not set in env");
                else
                  args.push(`--launch=${id}`, exe);
              }
            }

            startup(args, { env });
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__dirname, 'src/electron/preload.ts'),
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === 'test'
          // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
          ? undefined
          : {},
      }),
    ],
  }
})
