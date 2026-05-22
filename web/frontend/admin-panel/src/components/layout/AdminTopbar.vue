<template>
  <header class="topbar" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <button class="topbar-toggle" @click="toggleSidebar" aria-label="Toggle sidebar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <h1 class="topbar-title">{{ pageTitle }}</h1>

    <div class="topbar-right">
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <span class="user-name">{{ user?.username }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const uiStore = useUiStore()
const { sidebarOpen } = storeToRefs(uiStore)
const { toggleSidebar } = uiStore
const { user } = storeToRefs(useAuthStore())

const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string)?.replace(' — Admin', '') ?? 'Admin')
const userInitial = computed(() => user.value?.username?.[0]?.toUpperCase() ?? 'A')
</script>

<style scoped>
.topbar-toggle {
  background: none; border: none; color: var(--admin-text-secondary);
  padding: 0.5rem; border-radius: var(--radius-md);
  transition: all var(--transition);
}
.topbar-toggle:hover { background: var(--admin-surface-2); color: var(--admin-text); }
.topbar-title { font-size: 1rem; font-weight: 600; flex: 1; padding: 0 1rem; }
.topbar-right { display: flex; align-items: center; gap: 1rem; }
.user-info { display: flex; align-items: center; gap: 0.6rem; }
.user-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--admin-gradient); display: flex;
  align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem;
}
.user-name { font-size: 0.875rem; font-weight: 500; }
</style>
