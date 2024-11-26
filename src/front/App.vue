<script setup lang="ts">
import { ref } from 'vue'
import SystemBar from './components/SystemBar.vue';
import Setup from './components/Setup.vue';

const isSetup = ref(true);
</script>

<template>
  <v-app id="inspire">
    <SystemBar />
    <v-main scrollable>
      <Setup v-if="isSetup" @ready="isSetup = false" />
      <RouterView v-else />
    </v-main>
  </v-app>
</template>
