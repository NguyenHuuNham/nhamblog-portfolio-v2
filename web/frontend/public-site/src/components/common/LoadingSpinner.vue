<template>
  <div class="loading-wrap" :style="{ minHeight: height }">
    <div class="spinner"></div>
    <p v-if="label" class="loading-label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string; height?: string }>()
</script>

<style scoped>
.loading-wrap {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem;
}
.loading-label { color: var(--color-text-muted); font-size: 0.875rem; }
</style>
