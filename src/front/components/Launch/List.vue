<script setup lang="ts">
import { ILaunch } from '@shared/Launch';
import Item from "./Item.vue";

const { launchs, detail = false } = defineProps<{ launchs: ILaunch[], detail?: boolean }>();
</script>

<template>
	<v-list lines="two" density="compact" class="pa-0 overflow-visible">
		<template v-for="(launch, i) in launchs" :key="launch.id">
			<v-divider v-if="i != 0" />
			<Item :detail="detail" :launch="launch">
				<template v-slot:append>
					<slot name="append" v-bind="{ launch }" />
				</template>
			</Item>
		</template>
	</v-list>
</template>
