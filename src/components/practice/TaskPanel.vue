<template>
  <div class="task-panel">
    <div class="task-header">
      <h3 class="task-title">{{ task.title }}</h3>
      <span class="tag" :class="difficultyClass">{{ difficultyLabel }}</span>
    </div>
    <div class="task-body">
      <div class="task-description" v-html="renderedDescription"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types'
import MarkdownIt from 'markdown-it'
const props = defineProps<{ task: Task }>()
const md = new MarkdownIt({ breaks: true })
const renderedDescription = computed(() => md.render(props.task.description))
const difficultyLabel = computed(() => {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return map[props.task.difficulty] || props.task.difficulty
})
const difficultyClass = computed(() => {
  const map: Record<string, string> = { easy: 'tag-success', medium: 'tag-warning', hard: 'tag-primary' }
  return map[props.task.difficulty] || 'tag-primary'
})
</script>

<style scoped>
.task-panel { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-card); border-radius: var(--radius-lg); overflow: hidden; }
.task-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-lg); border-bottom: 1px solid var(--color-border-light); }
.task-title { font-size: var(--font-size-lg); font-weight: 600; }
.task-body { flex: 1; padding: var(--spacing-lg); overflow-y: auto; }
.task-description { font-size: var(--font-size-base); color: var(--color-text); line-height: 1.8; }
.task-description :deep(h1), .task-description :deep(h2) { font-size: var(--font-size-lg); margin-bottom: var(--spacing-md); }
.task-description :deep(p) { margin-bottom: var(--spacing-md); }
.task-description :deep(ul), .task-description :deep(ol) { padding-left: var(--spacing-xl); margin-bottom: var(--spacing-md); }
.task-description :deep(pre) { background: #f6f8fa; padding: var(--spacing-md); border-radius: var(--radius-sm); font-size: var(--font-size-sm); overflow-x: auto; }
.task-description :deep(code) { font-family: var(--font-family-mono); font-size: 0.9em; background: var(--color-primary-bg); padding: 2px 6px; border-radius: var(--radius-sm); }
</style>