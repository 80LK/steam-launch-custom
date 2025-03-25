import { createApp } from "vue";

import Index from "./Index.vue";
import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";
import router from "./routes";
import i18n from "./plugins/i18n";

import "./style.css";
import "./error";

createApp(Index)
	.use(i18n)
	.use(pinia)
	.use(vuetify)
	.use(router)
	.mount("#app");
