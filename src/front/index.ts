import { createApp } from "vue";

import Index from "./Index.vue";
import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";
import router from "./routes";

import "./style.css";

createApp(Index)
	.use(pinia)
	.use(vuetify)
	.use(router)
	.mount("#app");
