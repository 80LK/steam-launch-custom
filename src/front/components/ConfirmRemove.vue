<script setup lang="ts">
import { mdiDelete } from '@mdi/js';
const emit = defineEmits(['submit', 'cancel']);
const open = defineModel<boolean>({ default: false });
const { thing = 'this' } = defineProps<{ thing: string }>();

function cancel() {
	open.value = false;
	emit('cancel')
}
function submit() {
	open.value = false;
	emit('submit')
}
</script>


<template>
	<v-dialog persistent v-model="open">
		<v-card>
			<v-card-item :prepend-icon="mdiDelete">
				<v-card-title>
					Confirm remove
				</v-card-title>
			</v-card-item> <v-divider></v-divider>
			<v-card-text>
				Are you sure you want to remove {{ thing }}?
			</v-card-text>
			<v-card-actions>
				<v-btn text="No" @click="cancel()"></v-btn>
				<v-btn text="Yes" @click="submit()" type="submit" color="error"></v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
