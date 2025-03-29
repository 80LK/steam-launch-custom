import { ThemeDefinition } from "vuetify";

const steam: ThemeDefinition = {
	dark: true,
	colors: {
		background: '#2C323B',
		surface: '#171D25',
		'surface-light': '#171D25',
		'on-surface-variant': "#fff",

		'surface-bright': '#FFFFFF',
		'surface-variant': '#171D25',

		primary: '#2DA1D6',
	},
	variables: {
		'border-color': '#171D25',
		'button-border-radius': 0,
		'card-border-radius': 0,
		'input-variant': 'solo',
		'switch-inset': 'true'
	}
}

export default steam;
