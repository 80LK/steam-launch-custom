import { ThemeDefinition } from "vuetify";
import steam from "./steam";
import light from "./light";
import dark from "./dark";

const themes: Record<string, ThemeDefinition> = {
	steam,
	light,
	dark
}

export default themes;
