import { createApp } from "vue";

import Launch from "./Launch.vue";
import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";
import i18n from "./plugins/i18n";

import "./style.css";
import "./error";

createApp(Launch)
	.use(i18n)
	.use(pinia)
	.use(vuetify)
	.mount("#app");
