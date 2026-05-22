<template>
  <div>
    <AppHeader />
    <main class="cat-main">
      <div class="container">
        <h1 class="cat-heading">
          <span class="tag">Category</span>
          {{ $route.params.slug }}
        </h1>
        <LoadingSpinner v-if="loading" height="300px" />
        <div v-else-if="posts" class="posts-grid">
          <PostCard v-for="post in posts.items" :key="post.id" :post="post" />
          <p v-if="posts.items.length === 0" class="empty">No posts in this category yet.</p>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PostCard from '@/components/post/PostCard.vue'
import { usePostStore } from '@/stores/post.store'

const route = useRoute()
const postStore = usePostStore()
const { posts, loading } = storeToRefs(postStore)

onMounted(() => {
  postStore.fetchPosts({ category: route.params.slug as string, pageSize: 20 })
})
</script>

<style scoped>
.cat-main { padding-top: calc(var(--header-height) + 3rem); padding-bottom: 5rem; }
.cat-heading { font-size: 2rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.empty { color: var(--color-text-muted); text-align: center; padding: 3rem; }
</style>
