<template>
  <AdminLayout>
    <div class="dashboard">
      <h2 class="section-title">Overview</h2>

      <div v-if="loading" style="text-align:center;padding:3rem;color:var(--admin-text-muted)">Loading stats...</div>

      <div v-else-if="stats" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(124,111,247,0.15);color:#7c6ff7">📝</div>
          <div>
            <p class="stat-value">{{ stats.totalPosts }}</p>
            <p class="stat-label">Total Posts</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">✅</div>
          <div>
            <p class="stat-value">{{ stats.publishedPosts }}</p>
            <p class="stat-label">Published</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">💬</div>
          <div>
            <p class="stat-value">{{ stats.pendingComments }}</p>
            <p class="stat-label">Pending Comments</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">👁️</div>
          <div>
            <p class="stat-value">{{ stats.totalViews.toLocaleString() }}</p>
            <p class="stat-label">Total Views</p>
          </div>
        </div>
      </div>

      <!-- Recent Posts -->
      <div v-if="stats" class="admin-card" style="margin-top:2rem">
        <h3 class="card-title">Recent Posts</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in stats.recentPosts" :key="p.id">
              <td>{{ p.title }}</td>
              <td>
                <span :class="['badge', p.status === 'Published' ? 'badge-success' : 'badge-warning']">{{ p.status }}</span>
              </td>
              <td class="text-muted" style="font-size:0.8rem">{{ formatDate(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import api from '@/services/api'

const stats = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/admin/dashboard')
    stats.value = res.data.data
  } finally {
    loading.value = false
  }
})

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}
</script>

<style scoped>
.section-title { font-size: 1.5rem; margin-bottom: 1.5rem; font-weight: 700; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
.stat-card { display: flex; align-items: center; gap: 1rem; }
.stat-value { font-size: 1.75rem; font-weight: 800; }
.stat-label { font-size: 0.8rem; color: var(--admin-text-secondary); margin-top: 0.1rem; }
.card-title { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
</style>
