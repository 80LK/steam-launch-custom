<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { name } from '../../../package.json'
import {
	mdiClose,
	mdiDockWindow,
	mdiWindowMaximize,
	mdiMinus,
} from "@mdi/js"
import lightLogo from "../assets/logo-light.svg"


const maximized = ref(false)
function maximizedChange(value: boolean) {
	maximized.value = value;
}
let maximizedChangeListener = 0;
onMounted(() => {
	maximizedChangeListener = SystemBar.onChangeMaximized(maximizedChange);
})
onUnmounted(() => {
	SystemBar.offChangeMaximized(maximizedChangeListener);
})
function tryMinimize() {
	SystemBar.minimize();
}
function tryMaximize() {
	SystemBar.maximize();
}
function tryClose() {
	SystemBar.close();
}
</script>

<template>
	<v-system-bar :class="$style.dragable" :style="{ zIndex: 9999 }">
		<span class="pr-1"><v-img :src="lightLogo" :width="20" aspect-ratio="1/1" cover /></span>
		<span> {{ name }}</span>
		<v-spacer />
		<div :class="$style['not-dragable']">
			<v-btn :icon="mdiMinus" height="24" variant="plain" tile @click="tryMinimize" />
			<v-btn :icon="maximized ? mdiDockWindow : mdiWindowMaximize" height="24" variant="plain" tile
				@click="tryMaximize" />
			<v-btn :icon="mdiClose" height="24" variant="plain" tile color="red" @click="tryClose" />
		</div>
	</v-system-bar>
</template>

<style module>
.dragable {
	-webkit-user-select: none;
	user-select: none;
	-webkit-app-region: drag;
}

.not-dragable {
	-webkit-app-region: no-drag;
}
</style>
