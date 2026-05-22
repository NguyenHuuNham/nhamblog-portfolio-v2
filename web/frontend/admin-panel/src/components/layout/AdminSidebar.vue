<template>
  <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">B</div>
      <span class="sidebar-brand-text">NhamBlog Admin</span>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <span class="nav-section-label">Main</span>

      <RouterLink to="/dashboard" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/posts" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Posts</span>
      </RouterLink>

      <RouterLink to="/categories" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Categories</span>
      </RouterLink>

      <RouterLink to="/comments" class="nav-item" active-class="active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Comments</span>
      </RouterLink>

      <div style="margin-top: auto; padding-top: 1rem;">
        <span class="nav-section-label">Account</span>
        <button class="nav-item" style="width:100%; border:none; background:none; cursor:pointer;" @click="auth.logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const { sidebarOpen } = storeToRefs(useUiStore())
const auth = useAuthStore()
</script>
