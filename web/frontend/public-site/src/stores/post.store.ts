import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postService } from '@/services/post.service'
import type { PostSummary, Post } from '@/types/post.type'
import type { PaginationResult } from '@/types/api-response.type'

export const usePostStore = defineStore('posts', () => {
  const posts = ref<PaginationResult<PostSummary> | null>(null)
  const currentPost = ref<Post | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPosts(params: { page?: number; pageSize?: number; category?: string; search?: string } = {}) {
    loading.value = true
    error.value = null
    try {
      posts.value = await postService.getAll(params)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchBySlug(slug: string) {
    loading.value = true
    error.value = null
    try {
      currentPost.value = await postService.getBySlug(slug)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { posts, currentPost, loading, error, fetchPosts, fetchBySlug }
})
