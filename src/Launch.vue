<script setup lang="ts">
import { mdiPlay, mdiStop } from '@mdi/js';

const c = 12;
</script>

<template>
	<v-app id="inspire">
		<v-main scrollable>
			<v-img :class="['bg-grey-lighten-2', $style.header]" cover
				:src="`file:///C:/Users/80lkr/Pictures/volk s arbuzom.png`">
				<v-toolbar :class="$style.toolbar">
					<v-toolbar-title class="ma-0">Game</v-toolbar-title>
				</v-toolbar>

				<!-- href="steam://rungameid/730" -->
				<v-btn :prepend-icon="mdiStop" tile color="error" size="large" :class="$style.play">Cancel</v-btn>
			</v-img>
			<v-container fluid :class="$style.main">
				<!-- <v-row>
					<v-col cols="12"> -->
				<v-card tile>
					<template v-for="i in c" :key="i">
						<v-divider v-if="i != 1" />
						<v-card-item>
							<template v-slot:prepend>
								<v-avatar image="file:///C:/Users/80lkr/Pictures/volk s arbuzom.png" />
							</template>
							<v-card-title>
								Title {{ i }}
							</v-card-title>
							<template v-slot:append>
								<v-btn :prepend-icon="mdiPlay" tile color="success" size="large">Launch</v-btn>
							</template>
						</v-card-item>
					</template>
				</v-card>
				<!-- </v-col>
				</v-row> -->
			</v-container>

			<!-- <template v-for="i in c" :key="i">
				<v-divider v-if="i != 1" />
				<v-list-item>
					<template v-slot:prepend>
						<v-avatar image="file:///C:/Users/80lkr/Pictures/volk s arbuzom.png" />
					</template>
					<v-list-item-title>
						Title {{ i }}
					</v-list-item-title>
					<template v-slot:append>
						<v-btn :prepend-icon="mdiPlay" tile color="success" size="large">Launch</v-btn>
					</template>
				</v-list-item>
			</template> -->
		</v-main>
	</v-app>
</template>

<style lang="css" module>
.header {
	position: fixed;
	z-index: 1;
	width: 100%;
	height: var(--header-height, 170px);
	overflow: visible;
}

.header .toolbar {
	background: linear-gradient(180deg, black, transparent);
	color: white;
	text-align: center;
}

.header .play {
	position: absolute;
	right: 1em;
	bottom: 1em;
}

.main {
	overflow-y: auto;
	margin-top: var(--header-height, 170px);
	height: calc(100% - var(--header-height, 170px));
	padding: 0;
}
</style>
