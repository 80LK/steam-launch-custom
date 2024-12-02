<script lang="ts" setup>
import { mdiApplicationOutline, mdiCog, mdiFolder, mdiPencil } from '@mdi/js';
import { watch, ref, toRaw, computed } from 'vue';
import ILaunch, { INIT_LAUNCH } from '../../ILaunch';
import FilePicker from './FilePicker.vue';

const launch = defineModel<ILaunch | null>({
	default: null,
});
const { edit = false } = defineProps<{ edit?: boolean }>();

const emit = defineEmits(['cancel', 'submit']);
const open = ref(false);

const cacheLaunch = ref(INIT_LAUNCH());
watch(launch, (newValue) => {
	if (!newValue) return;
	open.value = true;
	cacheLaunch.value = Object.assign(INIT_LAUNCH(), newValue);
});

function cancel() {
	emit('cancel');
	open.value = false;
	launch.value = null;
}
function submit() {
	if (launch.value)
		Object.assign(launch.value, cacheLaunch.value);

	emit('submit', toRaw(launch.value), edit);
	open.value = false;
	launch.value = null;
}
function clear() {
	cacheLaunch.value = INIT_LAUNCH();
}

const defaultPathForExe = computed(() => {
	const l = cacheLaunch.value;
	if (!l.execute) return undefined;
	return l.execute + '/..';
})

const defaultPathForWorkDir = computed(() => {
	const l = cacheLaunch.value;
	if (!l.workdir) return defaultPathForExe.value;
	return l.workdir;
})

</script>

<template>
	<v-dialog max-width="600" :model-value="open" persistent @afterLeave="clear" scrollable>
		<v-card v-if="launch">
			<v-card-item :prepend-icon="mdiPencil">
				<v-card-title>
					{{ edit ? `Edit laucnh "${launch.name}"` : 'New router' }}
				</v-card-title>
			</v-card-item>
			<v-divider />
			<v-card-text>
				<v-text-field label="Title" variant="outlined" v-model="cacheLaunch.name" />

				<FilePicker label="Executable file" variant="outlined" v-model:model-value="cacheLaunch.execute"
					:icon="mdiApplicationOutline" :file="{ name: 'Application', extensions: ['exe'] }"
					:default-path="defaultPathForExe" />

				<v-combobox :prepend-inner-icon="mdiCog" label="Launch options" variant="outlined"
					v-model="cacheLaunch.launch" clearable chips multiple closable-chips
					hint="Press enter for add parameter"></v-combobox>

				<FilePicker label="Work Directory" variant="outlined" v-model:model-value="cacheLaunch.workdir"
					:icon="mdiFolder" file="directory" :default-path="defaultPathForWorkDir" />
			</v-card-text>
			<v-divider />
			<v-card-actions>
				<v-btn color="error" @click="cancel()">Cancel</v-btn>
				<v-btn color="success" @click="submit()">Save</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
