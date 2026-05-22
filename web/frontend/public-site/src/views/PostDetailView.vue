<template>
  <div>
    <AppHeader />
    <main class="detail-main">
      <LoadingSpinner v-if="loading" height="60vh" />

      <template v-else-if="post">
        <!-- Hero -->
        <div class="post-hero">
          <img
            v-if="post.thumbnailUrl"
            :src="post.thumbnailUrl"
            :alt="post.title"
            class="hero-img"
          />
          <div class="hero-overlay"></div>
          <div class="container hero-content">
            <RouterLink :to="`/categories/${post.categorySlug}`" class="tag">{{ post.categoryName }}</RouterLink>
            <h1 class="post-title">{{ post.title }}</h1>
            <div class="post-meta">
              <span>{{ post.authorName }}</span>
              <span class="dot">·</span>
              <span>{{ formatDate(post.publishedAt) }}</span>
              <span class="dot">·</span>
              <span>{{ post.viewCount }} views</span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="container content-wrap">
          <article class="prose" v-html="post.content"></article>

          <!-- Comments -->
          <section class="comments-section">
            <h2 class="comments-title">Comments ({{ comments.length }})</h2>

            <!-- Add comment -->
            <form class="comment-form" @submit.prevent="submitComment">
              <div class="comment-form-row">
                <input v-model="form.authorName" type="text" class="form-input" placeholder="Your name *" required />
                <input v-model="form.authorEmail" type="email" class="form-input" placeholder="Email (not published) *" required />
              </div>
              <textarea v-model="form.content" class="form-input" rows="4" placeholder="Write a comment... (min 10 characters)" required minlength="10"></textarea>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  {{ submitting ? 'Sending...' : 'Post Comment' }}
                </button>
                <p v-if="submitMsg" class="submit-msg">{{ submitMsg }}</p>
              </div>
            </form>

            <!-- Comment list -->
            <div class="comments-list">
              <div v-for="c in comments" :key="c.id" class="comment-item">
                <div class="comment-header">
                  <div class="comment-avatar">{{ c.authorName[0].toUpperCase() }}</div>
                  <div>
                    <p class="comment-author">{{ c.authorName }}</p>
                    <p class="comment-date">{{ formatDate(c.createdAt) }}</p>
                  </div>
                </div>
                <p class="comment-content">{{ c.content }}</p>
              </div>
              <p v-if="comments.length === 0" class="no-comments">No comments yet. Be the first!</p>
            </div>
          </section>
        </div>
      </template>

      <div v-else-if="error" class="not-found">
        <h1>Post not found</h1>
        <RouterLink to="/" class="btn btn-ghost">← Back to home</RouterLink>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { usePostStore } from '@/stores/post.store'
import { postService } from '@/services/post.service'
import type { Comment } from '@/types/post.type'

const route = useRoute()
const postStore = usePostStore()
const { currentPost: post, loading, error } = storeToRefs(postStore)

const comments = ref<Comment[]>([])
const form = ref({ authorName: '', authorEmail: '', content: '' })
const submitting = ref(false)
const submitMsg = ref('')

async function submitComment() {
  submitting.value = true
  try {
    if (!post.value) return
    await postService.addComment(post.value.id, form.value)
    submitMsg.value = '✓ Comment submitted! Awaiting approval.'
    form.value = { authorName: '', authorEmail: '', content: '' }
  } catch {
    submitMsg.value = 'Failed to send comment. Try again.'
  } finally {
    submitting.value = false
  }
}

function formatDate(date: string | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

onMounted(async () => {
  const slug = route.params.slug as string
  await postStore.fetchBySlug(slug)
  if (post.value) {
    comments.value = await postService.getComments(post.value.id)
  }
})
</script>

<style scoped>
.detail-main { padding-top: var(--header-height); }

.post-hero {
  position: relative; min-height: 420px;
  display: flex; align-items: flex-end;
  background: var(--color-bg-2);
}
.hero-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.35;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, var(--color-bg) 0%, transparent 60%);
}
.hero-content {
  position: relative; z-index: 1;
  padding-bottom: 3rem; padding-top: 3rem;
}
.post-title {
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.2; margin: 0.75rem 0;
  letter-spacing: -0.02em;
}
.post-meta {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; color: var(--color-text-muted);
}
.dot { opacity: 0.4; }

.content-wrap { max-width: 760px; margin: 0 auto; padding: 3rem 1rem 4rem; }

.comments-section { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--color-border); }
.comments-title { font-size: 1.25rem; margin-bottom: 1.5rem; }
.comment-form { margin-bottom: 2.5rem; display: flex; flex-direction: column; gap: 1rem; }
.comment-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 600px) { .comment-form-row { grid-template-columns: 1fr; } }
.form-actions { display: flex; align-items: center; gap: 1rem; }
.submit-msg { font-size: 0.875rem; color: var(--color-accent); }

.comments-list { display: flex; flex-direction: column; gap: 1.5rem; }
.comment-item {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 1.25rem;
}
.comment-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.comment-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--color-gradient); display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
}
.comment-author { font-weight: 600; font-size: 0.9rem; }
.comment-date { font-size: 0.75rem; color: var(--color-text-muted); }
.comment-content { color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.6; }
.no-comments { color: var(--color-text-muted); text-align: center; padding: 2rem; }

.not-found { text-align: center; padding: 8rem 2rem; }
.not-found h1 { font-size: 2rem; margin-bottom: 1.5rem; color: var(--color-text-muted); }
</style>
