<template>
  <div class="notfound">
    <div class="notfound-inner">
      <div class="notfound-code">404</div>
      <h1 class="notfound-title">Page not found</h1>
      <p class="notfound-desc">The page you're looking for doesn't exist or has been moved.</p>
      <RouterLink to="/" class="btn btn-primary">← Back to Home</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.notfound {
  min-height: 100vh; display: flex;
  align-items: center; justify-content: center;
  text-align: center; padding: 2rem;
}
.notfound-code {
  font-size: 8rem; font-weight: 900;
  line-height: 1; letter-spacing: -0.05em;
  background: var(--color-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}
.notfound-title { font-size: 2rem; margin-bottom: 1rem; }
.notfound-desc { color: var(--color-text-muted); margin-bottom: 2rem; }
</style>
