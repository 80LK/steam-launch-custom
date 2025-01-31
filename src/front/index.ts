import { createApp } from "vue";

import "./style.css";
import Index from "./Index.vue";
import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";
import router from "./routes";


createApp(Index)
	.use(pinia)
	.use(vuetify)
	.use(router)
	.mount("#app");
