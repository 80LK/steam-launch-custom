<script setup lang="ts">
import { mdiGithub } from '@mdi/js';
import tg from "../assets/Telegram.svg?inline";
import { name, version } from "../../../package.json";
function openUrl(url: string) {
	console.log('Try open url', url);
	App.openUrl(url);
}
</script>

<template>
	<v-dialog max-width="500">
		<template v-slot:activator="{ props: activatorProps }">
			<v-btn variant="text" size="small" v-bind="activatorProps">
				{{ name }} - {{ version }}
			</v-btn>
		</template>
		<template v-slot:default>
			<v-card>
				<v-card-item>
					<v-card-title>
						{{ $t('about.title') }}
					</v-card-title>
				</v-card-item>
				<v-divider />
				<v-card-text>
					<p class="mb-2" v-html="$t('about.text')" />

					<h2>{{ $t('about.links') }}</h2>
					<v-btn color="#2AABEE" class="mr-2" @click="openUrl('https://t.me/steam_launch_custom')">
						<template v-slot:prepend>
							<v-icon>
								<img :src="tg" style="width: 150%;" />
							</v-icon>
						</template>
						Telegram
					</v-btn>
					<v-btn :prepend-icon="mdiGithub" class="mr-2" color="#1A1F24"
						@click="openUrl('https://github.com/80LK/steam-launch-custom')">
						GitHub
					</v-btn>
				</v-card-text>
			</v-card>
		</template>
	</v-dialog>
</template>
