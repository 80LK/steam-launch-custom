import Index from "./Index.vue";
import router from "./routes";
import app from "./app";

app(Index)
	.use(router)
	.mount("#app");
