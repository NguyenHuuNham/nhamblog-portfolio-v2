<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">
        <div class="login-logo-icon">B</div>
        <h1 class="login-title">NhamBlog Admin</h1>
        <p class="login-sub">Sign in to manage your content</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="admin@blog.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          <svg v-if="loading" class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="login-hint">Default: admin@blog.com / Admin@123</p>
    </div>

    <div class="login-bg">
      <div class="login-glow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.value)
  } catch (e: any) {
    error.value = e.message || 'Login failed. Check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex;
  align-items: center; justify-content: center;
  padding: 2rem; position: relative; overflow: hidden;
}
.login-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: var(--admin-bg);
}
.login-glow {
  position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
  width: 900px; height: 500px;
  background: radial-gradient(ellipse, rgba(124,111,247,0.15) 0%, transparent 70%);
}
.login-box {
  width: 100%; max-width: 420px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px; padding: 2.5rem;
  position: relative; z-index: 1;
  box-shadow: 0 25px 60px rgba(0,0,0,0.5);
}
.login-logo { text-align: center; margin-bottom: 2rem; }
.login-logo-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--admin-gradient);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.5rem; color: white;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 24px var(--admin-accent-glow);
}
.login-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.35rem; }
.login-sub { color: var(--admin-text-secondary); font-size: 0.875rem; }
.login-form { display: flex; flex-direction: column; }
.login-btn { width: 100%; justify-content: center; padding: 0.75rem; margin-top: 0.5rem; }
.login-hint { text-align: center; color: var(--admin-text-muted); font-size: 0.75rem; margin-top: 1.25rem; }
.spin-icon { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
