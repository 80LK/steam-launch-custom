<script setup lang="ts">
import { ILaunch } from '@shared/Launch';
import Item from "./Item.vue";

const { launchs, detail = false, hideBroken = false } = defineProps<{ launchs: ILaunch[], detail?: boolean, hideBroken?: boolean }>();
</script>

<template>
	<v-list lines="two" density="compact" class="pa-0 overflow-visible">
		<template v-for="launch in launchs" :key="launch.id">
			<Item :detail="detail" :launch="launch" v-if="!(hideBroken && launch.broken)">
				<template v-slot:append>
					<slot name="append" v-bind="{ launch }" />
				</template>
			</Item>
		</template>
	</v-list>
</template>
