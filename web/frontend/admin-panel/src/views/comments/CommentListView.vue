<template>
  <AdminLayout>
    <div class="page-header">
      <h2 class="section-title">Comments</h2>
      <span class="badge badge-warning" v-if="pendingCount > 0">{{ pendingCount }} pending</span>
    </div>

    <div class="admin-card">
      <div v-if="loading" style="text-align:center;padding:2rem;color:var(--admin-text-muted)">
        Loading comments...
      </div>

      <template v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Post</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in result?.items" :key="c.id">
              <td style="font-weight:600;white-space:nowrap">{{ c.authorName }}</td>
              <td
                class="text-secondary"
                style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
              >{{ c.postTitle }}</td>
              <td
                class="text-secondary"
                style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
              >{{ c.content }}</td>
              <td>
                <span :class="['badge', c.isApproved ? 'badge-success' : 'badge-warning']">
                  {{ c.isApproved ? 'Approved' : 'Pending' }}
                </span>
              </td>
              <td class="text-muted" style="font-size:0.8rem;white-space:nowrap">
                {{ formatDate(c.createdAt) }}
              </td>
              <td>
                <div class="flex gap-sm">
                  <button
                    v-if="!c.isApproved"
                    class="btn btn-secondary btn-sm"
                    @click="approveComment(c.id)"
                  >✓ Approve</button>
                  <button class="btn btn-danger btn-sm" @click="deleteComment(c.id)">Delete</button>
                </div>
              </td>
            </tr>
            <tr v-if="!result?.items?.length">
              <td colspan="6" style="text-align:center;color:var(--admin-text-muted);padding:2rem">
                No comments yet.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="result && result.totalPages > 1" class="table-footer">
          <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="load(page - 1)">
            Prev
          </button>
          <span class="text-muted" style="font-size:0.875rem">{{ page }} / {{ result.totalPages }}</span>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="page >= result.totalPages"
            @click="load(page + 1)"
          >Next</button>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const result = ref<any>(null)
const loading = ref(true)
const page = ref(1)

const pendingCount = computed(
  () => result.value?.items?.filter((c: any) => !c.isApproved).length ?? 0
)

async function load(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get(`/admin/comments?page=${p}&pageSize=20`)
    result.value = res.data.data
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function approveComment(id: number) {
  try {
    await api.patch(`/admin/comments/${id}/approve`)
    ui.addToast('Comment approved ✓', 'success')
    await load(page.value)
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  }
}

async function deleteComment(id: number) {
  if (!confirm('Delete this comment permanently?')) return
  try {
    await api.delete(`/admin/comments/${id}`)
    ui.addToast('Comment deleted', 'success')
    await load(page.value)
  } catch (e: any) {
    ui.addToast(e.message, 'error')
  }
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(d))
}

onMounted(() => load())
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
}
.section-title { font-size: 1.5rem; font-weight: 700; }
.table-footer {
  display: flex; align-items: center; justify-content: center;
  gap: 1rem; padding: 1rem;
  border-top: 1px solid var(--admin-border);
}
</style>
