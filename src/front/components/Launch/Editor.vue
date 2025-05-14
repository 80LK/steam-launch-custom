<script lang="ts" setup>
import { mdiAlphabetical, mdiApplicationOutline, mdiCog, mdiFolder, mdiPencil } from '@mdi/js';
import { ILaunch, INIT_LAUNCH } from '@shared/Launch';
import useLaunchStore from '@store/launch';
import FilePicker from '@components/Input/FilePicker.vue';
import TextField from '@components/Input/TextField.vue';
import Combobox from '@components/Input/Combobox.vue';
import { computed, ref, toRaw, unref } from 'vue';
import { SubmitEventPromise } from 'vuetify';
import { useI18n } from 'vue-i18n';
const { t } = useI18n()
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
		if (value.length == 0) return t('launch.must_set', [thing]);
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
						{{ $t(isEdit ? `launch.edit` : 'launch.new', [store.get(launch.id)?.name]) }}
					</v-card-title>
				</v-card-item>
				<v-divider />
				<v-card-text>
					<TextField :label="$t('launch.title')" v-model="launch.name"
						:rules="[blockNullRule($t('launch.title'))]" :prepend-inner-icon="mdiAlphabetical" />

					<FilePicker v-model="launch.execute" :default-path="defaultPathForExe"
						:type="{ name: 'Application', extensions: ['exe'] }" :label="$t('launch.execute')"
						:rules="[blockNullRule($t('launch.execute'))]" :icon="mdiApplicationOutline" />

					<Combobox :prepend-inner-icon="mdiCog" :label="$t('launch.options')" clearable chips multiple
						closable-chips :hint="$t('launch.options_hint')" v-model="launch.launch" @paste="pasteArgs" />

					<FilePicker v-model="launch.workdir" :default-path="defaultPathForWorkDir" type="directory"
						:label="$t('launch.work')" :icon="mdiFolder" />
				</v-card-text>
				<v-divider />
				<v-card-actions>
					<v-btn color="error" @click="close()">{{ $t('launch.cancel') }}</v-btn>
					<v-btn color="success" type="submit">{{ $t('launch.save') }}</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-dialog>
</template>
