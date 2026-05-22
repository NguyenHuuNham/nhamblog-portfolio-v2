<template>
  <AdminLayout>
    <div class="page-header">
      <RouterLink to="/posts" class="btn btn-secondary btn-sm">← Back</RouterLink>
      <h2 class="section-title">Edit Post</h2>
    </div>

    <div v-if="loadingPost" style="text-align:center;padding:3rem;color:var(--admin-text-muted)">Loading post...</div>
    <PostForm v-else-if="initialData" :categories="categories" :initial="initialData" :loading="saving" @submit="handleUpdate" />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PostForm from '@/components/post/PostForm.vue'
import { adminPostService } from '@/services/admin-post.service'
import { useUiStore } from '@/stores/ui.store'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const categories = ref<any[]>([])
const initialData = ref<any>(null)
const loadingPost = ref(true)
const saving = ref(false)
const postId = Number(route.params.id)

async function handleUpdate(data: any) {
  saving.value = true
  try {
    await adminPostService.update(postId, data)
    ui.addToast('Post updated!', 'success')
    router.push('/posts')
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [postRes, catRes] = await Promise.all([
      api.get(`/admin/posts`),
      api.get('/admin/categories'),
    ])
    const found = postRes.data.data.items.find((p: any) => p.id === postId)
    initialData.value = found
    categories.value = catRes.data.data
  } finally {
    loadingPost.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.section-title { font-size: 1.5rem; font-weight: 700; }
</style>
