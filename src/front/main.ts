import { createApp } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import App from './App.vue'
import Launch from './Launch.vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import routes from './routes';
import './style.css'
import Pages, { getCurrentPage } from '../Page'
const IS_LAUNCH = getCurrentPage() == Pages.LAUNCH;
const cfg = await Config.get();

const vuetify = createVuetify({
  theme: {
    defaultTheme: cfg.dark ? 'dark' : 'light'
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    },
  },
});


if (IS_LAUNCH) {
  createApp(Launch)
    .use(vuetify)
    .mount('#app');
} else {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  createApp(App)
    .use(vuetify)
    .use(router)
    .mount('#app');
}
