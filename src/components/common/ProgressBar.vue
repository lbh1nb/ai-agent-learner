<template>
  <div class="progress-bar-wrapper">
    <div class="progress-bar-header" v-if="showLabel">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-value">{{ Math.round(percentage) }}%</span>
    </div>
    <div class="progress-bar-track">
      <div class="progress-bar-fill" :style="{ width: percentage + '%' }" :class="color"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  percentage: number
  label?: string
  showLabel?: boolean
  color?: 'primary' | 'success' | 'warning'
}>()
</script>

<style scoped>
.progress-bar-wrapper {
  width: 100%;
}
.progress-bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}
.progress-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.progress-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}
.progress-bar-track {
  height: 8px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
  background: var(--color-primary);
}
.progress-bar-fill.success { background: var(--color-success); }
.progress-bar-fill.warning { background: var(--color-warning); }
</style>