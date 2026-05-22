<template>
  <AdminLayout>
    <div class="page-header">
      <h2 class="section-title">Categories</h2>
    </div>

    <div class="admin-card">
      <!-- Add form -->
      <form class="add-form" @submit.prevent="handleCreate">
        <input
          v-model="newName"
          type="text"
          class="form-input"
          placeholder="New category name..."
          required
          style="flex:1"
        />
        <input
          v-model="newDesc"
          type="text"
          class="form-input"
          placeholder="Description (optional)"
          style="flex:2"
        />
        <button type="submit" class="btn btn-primary" :disabled="creating">
          {{ creating ? 'Adding...' : 'Add Category' }}
        </button>
      </form>

      <!-- Table -->
      <table class="data-table" style="margin-top:1.5rem">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Description</th>
            <th>Posts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td style="font-weight:600">{{ cat.name }}</td>
            <td class="font-mono text-muted" style="font-size:0.8rem">/{{ cat.slug }}</td>
            <td class="text-secondary" style="font-size:0.875rem">{{ cat.description || '—' }}</td>
            <td>
              <span class="badge badge-info">{{ cat.postCount }}</span>
            </td>
            <td>
              <button class="btn btn-danger btn-sm" @click="handleDelete(cat.id, cat.name)">
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="categories.length === 0 && !loading">
            <td colspan="5" style="text-align:center;color:var(--admin-text-muted);padding:2rem">
              No categories yet. Add one above.
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" style="text-align:center;padding:2rem;color:var(--admin-text-muted)">
        Loading...
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const categories = ref<any[]>([])
const loading = ref(true)
const newName = ref('')
const newDesc = ref('')
const creating = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await api.get('/admin/categories')
    categories.value = res.data.data
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    await api.post('/admin/categories', {
      name: newName.value.trim(),
      description: newDesc.value.trim() || undefined,
    })
    newName.value = ''
    newDesc.value = ''
    ui.addToast('Category created!', 'success')
    await load()
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  } finally {
    creating.value = false
  }
}

async function handleDelete(id: number, name: string) {
  if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return
  try {
    await api.delete(`/admin/categories/${id}`)
    ui.addToast(`"${name}" deleted`, 'success')
    await load()
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.section-title { font-size: 1.5rem; font-weight: 700; }
.add-form {
  display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
}
</style>
