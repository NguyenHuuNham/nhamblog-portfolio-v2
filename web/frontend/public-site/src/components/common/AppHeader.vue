<template>
  <header class="header" :class="{ scrolled: isScrolled }">
    <div class="container header-inner">
      <RouterLink to="/" class="logo">
        <span class="logo-icon">✦</span>
        <span class="logo-text">NhamBlog</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" class="nav-link" exact-active-class="active">Home</RouterLink>
        <RouterLink v-for="cat in categories" :key="cat.slug" :to="`/categories/${cat.slug}`" class="nav-link">
          {{ cat.name }}
        </RouterLink>
        <RouterLink to="/search" class="nav-link search-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { storeToRefs } from 'pinia'

const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)
categoryStore.fetchAll()

const isScrolled = ref(false)
const onScroll = () => { isScrolled.value = window.scrollY > 20 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--header-height);
  background: transparent;
  transition: all var(--transition-slow);
}
.header.scrolled {
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 100%;
}
.logo {
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: 700; font-size: 1.25rem;
  transition: opacity var(--transition);
}
.logo:hover { opacity: 0.8; }
.logo-icon {
  color: var(--color-accent);
  font-size: 1.4rem;
  filter: drop-shadow(0 0 8px var(--color-accent-glow));
}
.logo-text {
  background: var(--color-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.nav {
  display: flex; align-items: center; gap: 0.25rem;
}
.nav-link {
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem; font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition);
  display: flex; align-items: center;
}
.nav-link:hover, .nav-link.active {
  color: var(--color-text-primary);
  background: var(--color-surface);
}
.search-link { padding: 0.4rem 0.65rem; }
</style>
