<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
    <span class="loading-text" v-if="text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-primary-bg);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>