<script setup lang="ts">
import SystemBar from '@components/SystemBar.vue';
import Init from '@components/Init.vue';
</script>

<template>
	<v-app id="inspire">
		<SystemBar />
		<v-main scrollable>
			<Init>
				Launch
			</Init>
		</v-main>
	</v-app>
</template>
