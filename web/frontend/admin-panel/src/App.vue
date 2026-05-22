<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <!-- Toast Notifications -->
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="['toast', `toast-${t.type}`]"
        @click="removeToast(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui.store'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)
const { removeToast } = uiStore
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }
</style>
