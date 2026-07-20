<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#DDE5DB" stroke-width="2"/>
          <path d="M24 28h16M24 36h10" stroke="#DDE5DB" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-description" v-if="description">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}
.empty-icon { margin-bottom: var(--spacing-lg); opacity: 0.6; }
.empty-title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text); margin-bottom: var(--spacing-sm); }
.empty-description { font-size: var(--font-size-base); color: var(--color-text-secondary); max-width: 360px; }
</style>