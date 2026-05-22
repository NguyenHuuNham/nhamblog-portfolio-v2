<template>
  <AdminLayout>
    <div class="posts-header">
      <h2 class="section-title">Posts</h2>
      <RouterLink to="/posts/create" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Post
      </RouterLink>
    </div>

    <div class="admin-card">
      <div v-if="loading" style="text-align:center;padding:2rem;color:var(--admin-text-muted)">Loading...</div>
      <template v-else-if="result">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in result.items" :key="post.id">
              <td style="font-weight:500;max-width:280px">
                <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ post.title }}</span>
              </td>
              <td class="text-secondary">{{ post.categoryName }}</td>
              <td>
                <span :class="['badge', statusBadge(post.status)]">{{ post.status }}</span>
              </td>
              <td class="text-muted">{{ post.viewCount }}</td>
              <td class="text-muted" style="font-size:0.8rem">{{ formatDate(post.createdAt) }}</td>
              <td>
                <div class="flex gap-sm">
                  <RouterLink :to="`/posts/${post.id}/edit`" class="btn btn-secondary btn-sm">Edit</RouterLink>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(post.id, post.title)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="result.totalPages > 1" class="table-footer">
          <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="load(page-1)">Prev</button>
          <span class="text-muted" style="font-size:0.875rem">{{ page }} / {{ result.totalPages }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= result.totalPages" @click="load(page+1)">Next</button>
        </div>
      </template>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h3>Delete Post?</h3>
        <p class="text-secondary" style="margin:.75rem 0 1.5rem">"{{ deleteTarget.title }}" will be permanently deleted.</p>
        <div class="flex gap-sm" style="justify-content:flex-end">
          <button class="btn btn-secondary" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="deleting">{{ deleting ? 'Deleting...' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { adminPostService } from '@/services/admin-post.service'
import { useUiStore } from '@/stores/ui.store'
import type { PaginationResult } from '@/types/api-response.type'
import type { Post } from '@/types/post.type'

const ui = useUiStore()
const result = ref<PaginationResult<Post> | null>(null)
const loading = ref(true)
const page = ref(1)
const deleteTarget = ref<{ id: number; title: string } | null>(null)
const deleting = ref(false)

async function load(p = 1) {
  loading.value = true
  page.value = p
  try { result.value = await adminPostService.getAll({ page: p, pageSize: 15 }) }
  catch (e: any) { ui.addToast(e.message, 'error') }
  finally { loading.value = false }
}

function confirmDelete(id: number, title: string) { deleteTarget.value = { id, title } }

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await adminPostService.delete(deleteTarget.value.id)
    ui.addToast('Post deleted', 'success')
    deleteTarget.value = null
    await load(page.value)
  } catch (e: any) { ui.addToast(e.message, 'error') }
  finally { deleting.value = false }
}

function statusBadge(s: string) { return s === 'Published' ? 'badge-success' : s === 'Draft' ? 'badge-warning' : 'badge-info' }
function formatDate(d: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d)) }

onMounted(() => load())
</script>

<style scoped>
.posts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.section-title { font-size: 1.5rem; font-weight: 700; }
.table-footer { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border-top: 1px solid var(--admin-border); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
.modal { background: var(--admin-surface); border: 1px solid var(--admin-border); border-radius: var(--radius-lg); padding: 2rem; max-width: 420px; width: 90%; }
.modal h3 { font-size: 1.1rem; font-weight: 700; }
</style>
