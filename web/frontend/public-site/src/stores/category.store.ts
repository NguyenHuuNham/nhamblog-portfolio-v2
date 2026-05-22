import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types/category.type'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  async function fetchAll() {
    if (categories.value.length > 0) return // Cache: don't re-fetch
    loading.value = true
    try {
      categories.value = await categoryService.getAll()
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, fetchAll }
})
