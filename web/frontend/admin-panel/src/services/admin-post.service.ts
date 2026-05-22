import api from './api'
import type { ApiResponse, PaginationResult } from '@/types/api-response.type'
import type { Post, CreatePostRequest } from '@/types/post.type'

export const adminPostService = {
  async getAll(params: { page?: number; pageSize?: number; status?: string } = {}) {
    const res = await api.get<ApiResponse<PaginationResult<Post>>>('/admin/posts', { params })
    return res.data.data
  },

  async create(request: CreatePostRequest) {
    const res = await api.post<ApiResponse<Post>>('/admin/posts', request)
    return res.data.data
  },

  async update(id: number, request: CreatePostRequest) {
    const res = await api.put<ApiResponse<Post>>(`/admin/posts/${id}`, request)
    return res.data.data
  },

  async delete(id: number) {
    await api.delete(`/admin/posts/${id}`)
  },
}
