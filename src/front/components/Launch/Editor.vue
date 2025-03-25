<script lang="ts" setup>
import { mdiApplicationOutline, mdiCog, mdiFolder, mdiPencil } from '@mdi/js';
import { ILaunch, INIT_LAUNCH } from '@shared/Launch';
import useLaunchStore from '@store/launch';
import FilePicker from '@components/FilePicker.vue';
import { computed, ref, toRaw, unref } from 'vue';
import { SubmitEventPromise } from 'vuetify';

const emit = defineEmits(['create']);

function edit(launchID: number) {
	open(Object.assign({}, toRaw(store.get(launchID))));
}

function create(gameId: number) {
	open(INIT_LAUNCH(gameId));
}

function open(edit: ILaunch) {
	isEdit.value = edit.id !== 0;
	launch.value = edit;
	isOpened.value = true;
}

defineExpose({ edit, create });


const store = useLaunchStore()
const launch = ref(null as ILaunch | null);

const isEdit = ref(false);
const isOpened = ref(false);
async function submit(event: SubmitEventPromise) {
	const result = await event;
	if (!result.valid) return;

	const l = toRaw(unref(launch));
	if (!l) return;

	if (isEdit.value) {
		const launch = await store.edit(l)
		if (launch) emit('create', launch);
	} else {
		const launch = await store.create(l);
		if (launch) emit('create', launch);
	}

	close();
}
function close() {
	isOpened.value = false;
}
const defaultPathForExe = computed(() => {
	const l = launch.value;
	if (!l || !l.execute) return undefined;
	return l.execute + '/..';
})

const defaultPathForWorkDir = computed(() => {
	const l = launch.value;
	if (!l || !l.workdir) return defaultPathForExe.value;
	return l.workdir;
})

function blockNullRule(thing: string) {
	return (value: string) => {
		if (value.length == 0) return `${thing} must be set`;
		return true;
	}
}

function pasteArgs(event: ClipboardEvent) {
	event.preventDefault();

	if (!launch.value || !event.clipboardData) return;
	let paste = event.clipboardData.getData("text");
	let args = paste.match(/(?:[^\s"]+|"(?:\\.|[^"\\])*")+/g);
	if (!args) return;

	launch.value.launch.push(...args.map(arg => arg.replace(/^"|"$/g, '')))
}
</script>

<template>
	<v-dialog max-width="600" :model-value="isOpened" persistent scrollable>
		<v-form @submit.prevent="submit" v-if="launch">
			<v-card>
				<v-card-item :prepend-icon="mdiPencil">
					<v-card-title>
						{{ isEdit ? `Edit laucnh "${store.get(launch.id).name}"` : 'New router' }}
					</v-card-title>
				</v-card-item>
				<v-divider />
				<v-card-text>
					<v-text-field label="Title" variant="outlined" v-model="launch.name"
						:rules="[blockNullRule('Title')]" />

					<FilePicker v-model="launch.execute" :default-path="defaultPathForExe"
						:type="{ name: 'Application', extensions: ['exe'] }" v-slot="{ value, selectFile }">
						<v-text-field label="Executable file" variant="outlined" clearable
							:prepend-inner-icon="mdiApplicationOutline" :rules="[blockNullRule('Executable file')]"
							:model-value="value" @click:clear="launch.execute = ''" @click:control="selectFile" />
					</FilePicker>

					<v-combobox :prepend-inner-icon="mdiCog" label="Launch options" variant="outlined" clearable chips
						multiple closable-chips hint="Press enter for add parameter" v-model="launch.launch"
						@paste="pasteArgs" />

					<FilePicker v-model="launch.workdir" :default-path="defaultPathForWorkDir" type="directory"
						v-slot="{ value, selectFile }">
						<v-text-field label="Work Directory" variant="outlined" clearable
							:prepend-inner-icon="mdiFolder" :model-value="value" @click:clear="launch.workdir = ''"
							@click:control="selectFile" />
					</FilePicker>
				</v-card-text>
				<v-divider />
				<v-card-actions>
					<v-btn color="error" @click="close()">Cancel</v-btn>
					<v-btn color="success" type="submit">Save</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-dialog>
</template>
