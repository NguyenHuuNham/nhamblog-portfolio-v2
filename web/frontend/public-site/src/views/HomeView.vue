<template>
  <div>
    <AppHeader />
    <main class="home-main">
      <!-- Hero -->
      <section class="hero">
        <div class="container hero-inner">
          <div class="hero-badge">
            <span>✦</span> Personal Blog
          </div>
          <h1 class="hero-title">
            Ideas worth<br />
            <span class="gradient-text">reading.</span>
          </h1>
          <p class="hero-subtitle">
            Thoughts on technology, design, and the art of building things that matter.
          </p>
        </div>
        <div class="hero-glow"></div>
      </section>

      <!-- Posts -->
      <section class="posts-section">
        <div class="container">
          <LoadingSpinner v-if="loading" height="300px" label="Loading posts..." />

          <template v-else-if="posts">
            <div class="posts-grid">
              <TransitionGroup name="slide-up" appear>
                <PostCard
                  v-for="post in posts.items"
                  :key="post.id"
                  :post="post"
                />
              </TransitionGroup>
            </div>

            <!-- Pagination -->
            <div v-if="posts.totalPages > 1" class="pagination">
              <button
                class="btn btn-ghost"
                :disabled="!posts.hasPrevious"
                @click="changePage(currentPage - 1)"
              >← Prev</button>
              <span class="page-info">{{ currentPage }} / {{ posts.totalPages }}</span>
              <button
                class="btn btn-ghost"
                :disabled="!posts.hasNext"
                @click="changePage(currentPage + 1)"
              >Next →</button>
            </div>
          </template>

          <p v-else-if="error" class="error-msg">{{ error }}</p>
        </div>
      </section>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PostCard from '@/components/post/PostCard.vue'
import { usePostStore } from '@/stores/post.store'

const postStore = usePostStore()
const { posts, loading, error } = storeToRefs(postStore)
const currentPage = ref(1)

async function load(page = 1) {
  currentPage.value = page
  await postStore.fetchPosts({ page, pageSize: 9 })
}

function changePage(page: number) { load(page) }

onMounted(() => load())
</script>

<style scoped>
.home-main { padding-top: var(--header-height); }

.hero {
  position: relative; overflow: hidden;
  padding: 6rem 0 5rem;
  text-align: center;
}
.hero-inner { position: relative; z-index: 1; }
.hero-glow {
  position: absolute; top: -30%; left: 50%; transform: translateX(-50%);
  width: 800px; height: 400px;
  background: radial-gradient(ellipse, rgba(124, 111, 247, 0.18) 0%, transparent 70%);
  pointer-events: none;
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 1rem; margin-bottom: 1.5rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(124, 111, 247, 0.3);
  background: rgba(124, 111, 247, 0.08);
  font-size: 0.78rem; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--color-accent);
}
.hero-title {
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 1.1; margin-bottom: 1.25rem;
  letter-spacing: -0.03em;
}
.gradient-text {
  background: var(--color-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: 1.1rem; color: var(--color-text-secondary);
  max-width: 500px; margin: 0 auto;
  line-height: 1.7;
}

.posts-section { padding: 3rem 0 5rem; }
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 1rem; margin-top: 3rem;
}
.page-info { color: var(--color-text-muted); font-size: 0.875rem; }
.error-msg { text-align: center; color: var(--color-text-muted); padding: 3rem; }

/* TransitionGroup */
.slide-up-move { transition: all 0.4s ease; }
</style>
