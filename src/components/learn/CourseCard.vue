<template>
  <router-link :to="`/learn/${course.id}`" class="course-card card">
    <div class="course-header">
      <span class="tag" :class="difficultyClass">{{ difficultyLabel }}</span>
      <span class="tag tag-primary">{{ categoryLabel }}</span>
    </div>
    <h3 class="course-title">{{ course.title }}</h3>
    <p class="course-desc">{{ course.description }}</p>
    <div class="course-footer">
      <ProgressBar :percentage="progress" :show-label="false" />
      <span class="course-progress-text">{{ Math.round(progress) }}%</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Course } from '@/types'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types'
import ProgressBar from '@/components/common/ProgressBar.vue'

const props = defineProps<{ course: Course; progress: number }>()

const categoryLabel = computed(() => CATEGORY_LABELS[props.course.category] || props.course.category)
const difficultyLabel = computed(() => DIFFICULTY_LABELS[props.course.difficulty] || props.course.difficulty)
const difficultyClass = computed(() => {
  const map: Record<string, string> = { beginner: 'tag-success', intermediate: 'tag-warning', advanced: 'tag-primary' }
  return map[props.course.difficulty] || 'tag-primary'
})
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.course-card:hover { border-color: var(--color-primary); }
.course-header { display: flex; gap: var(--spacing-sm); }
.course-title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text); }
.course-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.5; flex: 1; }
.course-footer { display: flex; align-items: center; gap: var(--spacing-md); }
.course-footer > :first-child { flex: 1; }
.course-progress-text { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); }
</style>