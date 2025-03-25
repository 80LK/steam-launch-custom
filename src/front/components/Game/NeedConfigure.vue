<script setup lang="ts">
import useGamesStore from '@store/games';
import { ref } from 'vue';

const store = useGamesStore();
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
			<v-btn color="warning" size="small" variant="flat" :icon="false" :loading="isWriting" @click="write">
				{{ $t('configure.now') }}
			</v-btn>
		</template>
	</v-alert>
</template>
