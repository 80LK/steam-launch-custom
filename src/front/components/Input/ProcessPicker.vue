<script setup lang="ts">
import { ref } from 'vue';
import { mdiApplication, mdiMinusBox, mdiPlusBox } from '@mdi/js';
import type { ProcessInfo } from "../../../shared/ProcessList"

const opened = ref(false);
const items = ref([] as ProcessInfoItem[]);
const search = ref("");
const $emit = defineEmits(['select']);

export interface ProcessInfoItem extends ProcessInfo {
	id: number;
	title: string;
	icon: string;
	children: ProcessInfoItem[] | null;
}

function buildInfoToItem(item: ProcessInfo): ProcessInfoItem {
	return Object.assign({
		id: item.pid,
		title: item.name,
		icon: `slc-image://process_${item.name}`,
		children: item.childs.length > 0 ? item.childs.map(item => buildInfoToItem(item)) : null
	}, item)
}

const loading = ref(false);
async function load() {
	loading.value = true;
	// const loadedItems: ProcessInfo[] = (await import("../../assets/process_fixtures.json")).default;
	const loadedItems = await App.getProcessList();
	items.value = loadedItems.map(item => buildInfoToItem(item))
	loading.value = false
}

function close() {
	opened.value = false;
}

function select({ id }: { id: unknown }) {
	$emit('select', id as ProcessInfoItem);
	close();
}
function open(arg: any) {
	if (!ignoreSelect.value) {
		select(arg);
	}
}

const ignoreSelect = ref(false);
function toggleTree(e: PointerEvent, callback: (_: PointerEvent) => void) {
	e.stopPropagation();
	ignoreSelect.value = true;
	callback(e);
	ignoreSelect.value = false;
}
</script>

<template>
	<v-dialog max-width="700px" v-model="opened" @after-enter="load" @after-leave="loading = true" persistent
		scrollable>
		<template v-slot:activator="{ props: activatorProps }">
			<v-btn color="primary" v-bind="activatorProps" block>{{ $t('process_picker.select') }}</v-btn>
		</template>

		<v-card>
			<v-card-title>
				<div style="display: flex; align-items: center; gap: .5em ">
					{{ $t('process_picker.title') }}
					<v-text-field hide-details density="compact" v-model="search" clearable
						:placeholder="$t('process_picker.search')" />
				</div>
			</v-card-title>
			<v-divider />

			<div v-if="loading" style="display: flex; height: 100px; justify-content: center; align-items: center;">
				<v-progress-circular indeterminate />
			</div>

			<v-treeview v-else :items="items" indent-lines="default" density="compact" :separate-roots="false"
				@click:select="select" @click:open="open" :open-on-click="true" return-object :search="search"
				false-icon="null" true-icon="null">
				<template #prepend="{ item }">
					<v-img :src="item.icon" :width="30" :height="30">
						<template #placeholder>
							<v-icon :icon="mdiApplication" density="compact" />
						</template>
					</v-img>
				</template>
				<template #toggle="{ isOpen, props: { onClick } }">
					<v-btn :icon="isOpen ? mdiMinusBox : mdiPlusBox" @click="toggleTree($event, onClick)" />
				</template>
				<template #subtitle="{ item }">
					{{ item.argv }}
				</template>
			</v-treeview>

			<v-divider />
			<v-card-actions>
				<v-spacer />

				<v-btn color="error" @click="close()">{{ $t('process_picker.cancel') }}</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
