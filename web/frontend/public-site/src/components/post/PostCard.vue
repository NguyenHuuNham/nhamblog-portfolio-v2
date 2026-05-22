<template>
  <RouterLink :to="`/posts/${post.slug}`" class="post-card">
    <div class="post-thumbnail">
      <img
        v-if="post.thumbnailUrl"
        :src="post.thumbnailUrl"
        :alt="post.title"
        loading="lazy"
        class="thumbnail-img"
      />
      <div v-else class="thumbnail-placeholder">
        <span>✦</span>
      </div>
      <span class="post-category">{{ post.categoryName }}</span>
    </div>
    <div class="post-body">
      <h2 class="post-title">{{ post.title }}</h2>
      <p v-if="post.excerpt" class="post-excerpt">{{ post.excerpt }}</p>
      <div class="post-meta">
        <span class="meta-author">{{ post.authorName }}</span>
        <span class="meta-divider">·</span>
        <span class="meta-date">{{ formatDate(post.publishedAt) }}</span>
        <span class="meta-divider">·</span>
        <span class="meta-views">{{ post.viewCount }} views</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PostSummary } from '@/types/post.type'

defineProps<{ post: PostSummary }>()

function formatDate(date: string | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}
</script>

<style scoped>
.post-card {
  display: block;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition);
  text-decoration: none;
}
.post-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.post-thumbnail { position: relative; aspect-ratio: 16/9; overflow: hidden; }
.thumbnail-img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-slow); }
.post-card:hover .thumbnail-img { transform: scale(1.04); }
.thumbnail-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, var(--color-bg-3), var(--color-bg-2));
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: var(--color-accent);
  opacity: 0.5;
}
.post-category {
  position: absolute; top: 0.75rem; left: 0.75rem;
  background: rgba(10,10,15,0.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.65rem;
  font-size: 0.7rem; font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.04em; text-transform: uppercase;
}
.post-body { padding: 1.25rem; }
.post-title {
  font-size: 1.05rem; font-weight: 700;
  line-height: 1.35; margin-bottom: 0.5rem;
  color: var(--color-text-primary);
  transition: color var(--transition);
}
.post-card:hover .post-title { color: var(--color-accent); }
.post-excerpt {
  font-size: 0.875rem; color: var(--color-text-secondary);
  line-height: 1.6; margin-bottom: 1rem;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.post-meta {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.75rem; color: var(--color-text-muted);
}
.meta-divider { opacity: 0.5; }
</style>
