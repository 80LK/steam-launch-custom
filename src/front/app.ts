import { Component, createApp } from "vue";

import vuetify from "./plugins/vuetify";
import pinia from "./plugins/pinia";
import i18n from "./plugins/i18n";

import "./style.scss";
import "./error";

function app(component: Component) {
	return createApp(component)
		.use(i18n)
		.use(pinia)
		.use(vuetify);
}

export default app;
