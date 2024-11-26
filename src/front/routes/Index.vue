<script setup lang="ts">
import { mdiCached, mdiMagnify } from "@mdi/js";
import Container from "../components/FlexGrid.vue"
import GameCard from "../components/GameCard.vue";
import Settings from "../components/Settings.vue"
const c = 12;

</script>

<template>
	<v-container fluid>
		<v-row>
			<v-col cols="12">
				<v-alert type="warning" variant="tonal" border="start">
					<div style="display: flex; align-items: center; justify-content: space-between">
						You need close Steam and rewrite launch option
						<v-btn color="warning">Now</v-btn>
					</div>
				</v-alert>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12">
				<v-text-field label="Search" clearable variant="outlined" hide-details="auto">
					<template v-slot:label="{ label }">
						<v-icon :icon="mdiMagnify" /> {{ label }}
					</template>
					<template v-slot:append>
						<v-btn size="x-large" color="green" :prepend-icon="mdiCached">Scan game</v-btn>
					</template>
				</v-text-field>

			</v-col>
			<v-col cols="12">
				<Container padding="0">
					<GameCard v-for="i in c" :key="i" :id="i" :title="`Game ${i}`" :downloaded="i % 2 == 0"
						:configured="i % 3" />
				</Container>
			</v-col>
		</v-row>
	</v-container>
	<Settings />
</template>
