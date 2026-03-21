<script setup lang="ts">
import { mdiAlertOutline } from '@mdi/js';
import useConfigure from '@store/configure';
import { ref } from 'vue';

const store = useConfigure();
const cantWrite = ref(true);
App.parentProcessIsSteam().then((v) => cantWrite.value = v);

const isWriting = ref(false);
async function write() {
	if (isWriting.value) return;
	isWriting.value = true;
	await store.write()
	isWriting.value = false;
}
</script>

<template>
	<v-alert type="warning" variant="tonal" border="start" v-if="store.needWrite">
		{{ $t('configure.need_write') }}
		<template v-slot:close>
			<span v-if="cantWrite">
				<v-icon :icon="mdiAlertOutline" v-tooltip="$t('configure.cant_write')" color="error" />
			</span>
			<v-btn v-else color="warning" size="small" variant="flat" :icon="false" :loading="isWriting" @click="write">
				{{ $t('configure.now') }}
			</v-btn>
		</template>
	</v-alert>
</template>
