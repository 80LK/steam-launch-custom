<script setup lang="ts">
import { mdiDelete } from '@mdi/js';
import { ref } from 'vue';

const thingRemove = ref('this');
const isOpen = ref(false);

let confirm = () => { };
let reject = () => { };
function open(thing: string = 'this') {
	isOpen.value = true;
	thingRemove.value = thing;
	return new Promise<boolean>(r => {
		confirm = () => r(true)
		reject = () => r(false);
	});
}

defineExpose({ open });

function cancel() {
	isOpen.value = false;
	reject();
}
function submit() {
	isOpen.value = false;
	confirm();
}
</script>

<template>
	<v-dialog max-width="600" persistent v-model="isOpen">
		<v-card>
			<v-card-item :prepend-icon="mdiDelete">
				<v-card-title>
					{{ $t('remove.confirm') }}
				</v-card-title>
			</v-card-item> <v-divider></v-divider>
			<v-card-text>
				{{ $t('remove.sure', [$t(`remove.${thingRemove}`, thingRemove)]) }}
			</v-card-text>
			<v-card-actions>
				<v-btn :text="$t('remove.no')" @click="cancel()"></v-btn>
				<v-btn :text="$t('remove.yes')" @click="submit()" type="submit" color="error"></v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
