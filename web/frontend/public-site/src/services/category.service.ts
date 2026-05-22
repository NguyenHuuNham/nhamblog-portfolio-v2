import api from './api'
import type { ApiResponse } from '@/types/api-response.type'
import type { Category } from '@/types/category.type'

export const categoryService = {
  async getAll() {
    const res = await api.get<ApiResponse<Category[]>>('/categories')
    return res.data.data
  },
}
