<template>
  <div>
    <AppHeader />
    <main class="search-main">
      <div class="container">
        <h1 class="search-heading">Search</h1>
        <div class="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Search posts..."
            @input="debouncedSearch"
          />
        </div>

        <LoadingSpinner v-if="loading" height="200px" />

        <div v-else-if="posts" class="search-results">
          <p class="results-count" v-if="query">
            {{ posts.totalCount }} result{{ posts.totalCount !== 1 ? 's' : '' }} for "{{ query }}"
          </p>
          <div class="posts-grid">
            <PostCard v-for="post in posts.items" :key="post.id" :post="post" />
          </div>
          <p v-if="posts.items.length === 0 && query" class="no-results">
            No posts found. Try a different keyword.
          </p>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PostCard from '@/components/post/PostCard.vue'
import { usePostStore } from '@/stores/post.store'
import { storeToRefs } from 'pinia'

const postStore = usePostStore()
const { posts, loading } = storeToRefs(postStore)
const query = ref('')
let timer: ReturnType<typeof setTimeout>

function debouncedSearch() {
  clearTimeout(timer)
  if (!query.value.trim()) { postStore.fetchPosts({}); return }
  timer = setTimeout(() => {
    postStore.fetchPosts({ search: query.value, pageSize: 20 })
  }, 400)
}
</script>

<style scoped>
.search-main { padding-top: calc(var(--header-height) + 3rem); padding-bottom: 5rem; }
.search-heading { font-size: 2.5rem; margin-bottom: 1.5rem; }
.search-bar {
  display: flex; align-items: center; gap: 0.75rem;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-full); padding: 0.75rem 1.25rem;
  margin-bottom: 2.5rem; max-width: 600px;
  transition: border-color var(--transition);
}
.search-bar:focus-within { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-glow); }
.search-bar svg { color: var(--color-text-muted); flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  color: var(--color-text-primary); font-size: 1rem;
}
.search-input::placeholder { color: var(--color-text-muted); }
.results-count { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1.5rem; }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.no-results { text-align: center; color: var(--color-text-muted); padding: 3rem; }
</style>
