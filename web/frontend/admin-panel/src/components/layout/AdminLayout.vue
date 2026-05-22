<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-main" :class="{ 'sidebar-collapsed': !sidebarOpen }">
      <AdminTopbar />
      <div class="admin-content">
        <div class="admin-page">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'
import { useUiStore } from '@/stores/ui.store'

const { sidebarOpen } = storeToRefs(useUiStore())
</script>
