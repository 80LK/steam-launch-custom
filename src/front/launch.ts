import { createApp } from "vue";

import Launch from "./Launch.vue";
import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";

import "./style.css";

createApp(Launch)
	.use(pinia)
	.use(vuetify)
	.mount("#app");
