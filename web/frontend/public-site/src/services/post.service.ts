import api from './api'
import type { ApiResponse, PaginationResult } from '@/types/api-response.type'
import type { Post, PostSummary, Comment } from '@/types/post.type'

export const postService = {
  async getAll(params: { page?: number; pageSize?: number; category?: string; search?: string } = {}) {
    const res = await api.get<ApiResponse<PaginationResult<PostSummary>>>('/posts', { params })
    return res.data.data
  },

  async getBySlug(slug: string) {
    const res = await api.get<ApiResponse<Post>>(`/posts/${slug}`)
    return res.data.data
  },

  async getComments(postId: number) {
    const res = await api.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`)
    return res.data.data
  },

  async addComment(postId: number, payload: { authorName: string; authorEmail: string; content: string }) {
    const res = await api.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, payload)
    return res.data
  },
}
