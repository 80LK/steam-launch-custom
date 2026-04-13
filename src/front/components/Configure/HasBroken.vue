<script setup lang="ts">
import { mdiAlertOutline } from '@mdi/js';
import useBrokenLaunches from '@store/brokenLaunches';
const brokenLaunches = useBrokenLaunches();
</script>

<template>
	<v-alert type="error" variant="tonal" border="start" v-if="brokenLaunches.count > 0" :icon="mdiAlertOutline">
		{{ $t('configure.has_broken_launches') }}

		<template v-slot:close>
			<v-btn class="mr-2" size="small" variant="flat" :icon="false" color="error" to="/broken_launches">
				{{ $t('configure.fix_broken_launches') }}
			</v-btn>
		</template>
	</v-alert>
</template>
