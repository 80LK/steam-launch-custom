<script lang="ts" setup>
import { UpdateState } from '@shared/Updater';
import useUpdaterStore from '@store/updater';
import { computed, ref } from 'vue';

const showen = ref(true);

const store = useUpdaterStore();
store.check();

const hasUpdate = computed(() => store.state != UpdateState.NO && showen.value);
const isCheck = computed(() => store.state == UpdateState.CHECK);
const isAvailable = computed(() => store.state == UpdateState.HAVE || store.state == UpdateState.DOWNLOADING);
const isDownloading = computed(() => store.state == UpdateState.DOWNLOADING);
const isDownloaded = computed(() => store.state == UpdateState.DOWNLOADED);
const color = computed(() => isCheck.value ? undefined : 'success')
const message = computed(() => isCheck.value ? 'Checking updates' : `Update ${store.version} is available`);
</script>

<template>
	<v-alert :type="color" variant="tonal" border="start" v-if="hasUpdate">
		<template v-slot:prepend v-if="isCheck">
			<v-progress-circular indeterminate />
		</template>
		{{ message }}
		<template v-slot:close v-if="!isCheck">
			<v-btn color="success" class="mr-2" size="small" variant="flat" :icon="false"
				v-if="isDownloaded">Install</v-btn>

			<v-btn color="success" class="mr-2" size="small" variant="flat" :icon="false" v-if="isAvailable"
				:loading="isDownloading" @click="store.download()">Download</v-btn>

			<v-btn color="error" size="small" variant="flat" :icon="false" @click="showen = false">Hide</v-btn>
		</template>
	</v-alert>
</template>
