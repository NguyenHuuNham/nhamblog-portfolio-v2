<template>
  <AdminLayout>
    <div class="page-header">
      <RouterLink to="/posts" class="btn btn-secondary btn-sm">← Back</RouterLink>
      <h2 class="section-title">Create Post</h2>
    </div>

    <PostForm :categories="categories" :loading="saving" @submit="handleCreate" />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PostForm from '@/components/post/PostForm.vue'
import { adminPostService } from '@/services/admin-post.service'
import { useUiStore } from '@/stores/ui.store'
import api from '@/services/api'
import type { Category } from '@/types/post.type'

const router = useRouter()
const ui = useUiStore()
const categories = ref<Category[]>([])
const saving = ref(false)

async function handleCreate(data: any) {
  saving.value = true
  try {
    await adminPostService.create(data)
    ui.addToast('Post created!', 'success')
    router.push('/posts')
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const res = await api.get('/admin/categories')
  categories.value = res.data.data
})
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.section-title { font-size: 1.5rem; font-weight: 700; }
</style>
