<script setup lang="ts">
import SystemBar from '@components/SystemBar.vue';
import Settings from "@components/Settings.vue"
import Init from '@components/Init.vue';

const versions = App.versions;
</script>

<template>
	<v-app id="inspire">
		<SystemBar />
		<v-main scrollable>
			<Init>
				<RouterView />
			</Init>
		</v-main>

		<v-footer app class="py-5 border-t-thin">
			<v-row justify="center" no-gutters>
				<v-btn v-for="(version, module) in versions" :key="module" class="ma-1" variant="text" size="small">
					{{ module }} - {{ version }}
				</v-btn>
				<Settings />
			</v-row>
		</v-footer>
	</v-app>
</template>
