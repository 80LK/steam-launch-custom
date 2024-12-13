<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { UpdateInfo, UpdateState } from '../../UpdateInfo';

const update = ref({ state: UpdateState.NO, version: null } as UpdateInfo);
const available = ref(false);
const loading = ref(false);

async function checkUpdate() {
	update.value = await CheckerUpdate.check();
	if (update.value.state !== UpdateState.NO)
		available.value = true;
}

async function download() {
	loading.value = true;
	if (await CheckerUpdate.download()) {
		update.value.state = UpdateState.DOWNLOADED;
	}
	loading.value = false;
}
function insatll() {
	CheckerUpdate.install();
}
onMounted(() => checkUpdate());
</script>

<template>
	<v-alert type="warning" variant="tonal" border="start" v-if="available">
		<div style="display: flex; align-items: center; justify-content: space-between">
			Update {{ update.version }} is available
			<div>
				<v-btn color="success" class="mr-2" v-if="update.state == UpdateState.DOWNLOADED"
					@click="insatll()">Install</v-btn>
				<v-btn color="success" class="mr-2" v-if="update.state == UpdateState.YES" @click="download()"
					:loading="loading">Download</v-btn>
				<v-btn color="error" v-if="!loading" @click="available = false">Hide</v-btn>
			</div>
		</div>
	</v-alert>
</template>
