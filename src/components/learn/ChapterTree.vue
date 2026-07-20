<template>
  <div class="chapter-tree">
    <h3 class="tree-title">章节列表</h3>
    <div class="chapter-list">
      <router-link
        v-for="chapter in chapters"
        :key="chapter.id"
        :to="`/learn/${courseId}/${chapter.id}`"
        class="chapter-item"
        :class="{ active: activeChapterId === chapter.id, completed: completedIds.has(chapter.id) }"
      >
        <div class="chapter-indicator">
          <span v-if="completedIds.has(chapter.id)" class="check-icon">✓</span>
          <span v-else class="chapter-number">{{ chapter.sortOrder }}</span>
        </div>
        <div class="chapter-info">
          <span class="chapter-title">{{ chapter.title }}</span>
          <span class="chapter-meta">
            <span class="chapter-type">{{ chapter.type === 'practice' ? '实操' : '理论' }}</span>
            <span>{{ chapter.estimatedMinutes }}分钟</span>
          </span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '@/types'

const props = defineProps<{
  chapters: Chapter[]
  courseId: number
  activeChapterId: number
  completedIds: Set<number>
}>()
</script>

<style scoped>
.chapter-tree { padding: var(--spacing-lg); }
.tree-title {
  font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--spacing-md); padding: 0 var(--spacing-sm);
}
.chapter-list { display: flex; flex-direction: column; gap: 2px; }
.chapter-item {
  display: flex; align-items: center; gap: var(--spacing-md); padding: 10px 12px;
  border-radius: var(--radius-md); text-decoration: none; color: var(--color-text); transition: all var(--transition-fast);
}
.chapter-item:hover { background: var(--color-bg-hover); }
.chapter-item.active { background: var(--color-primary-bg); color: var(--color-primary); }
.chapter-indicator {
  width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-bg);
  border: 2px solid var(--color-border); display: flex; align-items: center; justify-content: center;
  font-size: var(--font-size-xs); font-weight: 600; flex-shrink: 0;
}
.chapter-item.active .chapter-indicator { border-color: var(--color-primary); }
.chapter-item.completed .chapter-indicator { background: var(--color-success); border-color: var(--color-success); }
.check-icon { color: white; font-size: var(--font-size-sm); }
.chapter-info { display: flex; flex-direction: column; min-width: 0; }
.chapter-title { font-size: var(--font-size-base); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chapter-meta { display: flex; gap: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--color-text-light); }
.chapter-type { padding: 0 6px; border-radius: var(--radius-sm); background: var(--color-primary-bg); color: var(--color-primary); }
</style>