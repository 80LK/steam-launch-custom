<script setup lang="ts">
import SystemBar from '@components/SystemBar.vue';
import Settings from "@components/Settings.vue"
import Init from '@components/Init.vue';
import About from '@components/About.vue';
import Index from './routes/Index.vue';

</script>

<template>
	<v-app id="inspire">
		<SystemBar />
		<v-main scrollable>
			<Init>
				<RouterView v-slot="{ Component }">
					<KeepAlive :include="Index.__name">
						<component :is="Component" />
					</KeepAlive>
				</RouterView>
			</Init>
		</v-main>

		<v-footer app class="py-5 border-t-thin">
			<v-row justify="center" no-gutters>
				<About />
				<Settings />
			</v-row>
		</v-footer>
	</v-app>
</template>
