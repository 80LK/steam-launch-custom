<script setup lang="ts">
import { ILaunch } from '@shared/Launch';

const { detail = false, launch } = defineProps<{ detail?: boolean, launch: ILaunch }>();
</script>

<template>
	<v-list-item>
		<template v-slot:prepend>
			<v-avatar :image="launch.image" class="bg-grey-lighten-2" />
		</template>
		<v-list-item-title>
			{{ launch.name }}
		</v-list-item-title>
		<v-list-item-subtitle v-if="detail">
			{{ launch.execute }}
			<template v-if="launch.launch.length">
				<v-divider />
				{{ launch.launch }}
			</template>
		</v-list-item-subtitle>
		<template v-slot:append>
			<slot name="append" />
		</template>
	</v-list-item>
</template>
