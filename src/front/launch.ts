import { createApp } from "vue";

import "./style.css";
import Launch from "./Launch.vue";
import vuetify from "./plugins/vuetify";


createApp(Launch)
	.use(vuetify)
	.mount("#app");
