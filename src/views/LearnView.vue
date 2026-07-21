<template>
  <div class="learn-view page-container fade-in">
    <h1 class="page-title">学习中心</h1>
    <div class="category-filters">
      <button v-for="cat in categories" :key="cat.value" class="filter-btn" :class="{ active: store.currentCategory === cat.value }" @click="store.setCurrentCategory(cat.value)">{{ cat.label }}</button>
    </div>
    <LoadingSpinner v-if="store.isLoading" text="加载课程中..." />
    <div v-else-if="store.filteredCourses.length === 0" class="empty-wrap"><EmptyState title="暂无课程" description="该分类下还没有课程，请选择其他分类" /></div>
    <div v-else class="courses-grid">
      <CourseCard v-for="course in store.filteredCourses" :key="course.id" :course="course" :progress="getProgress(course.id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCoursesStore } from '@/stores/courses'
import { CATEGORY_LABELS, type CourseCategory } from '@/types'
import CourseCard from '@/components/learn/CourseCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useCoursesStore()
const progressMap = ref<Record<number, number>>({})
const categories: Array<{ value: CourseCategory | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value: value as CourseCategory, label }))
]

onMounted(async () => {
  await store.loadCourses()
  for (const course of store.courses) {
    try {
      const [total] = await window.electronAPI.dbQuery('SELECT COUNT(*) as count FROM chapters WHERE course_id = ?', [course.id])
      const [completed] = await window.electronAPI.dbQuery("SELECT COUNT(*) as count FROM learning_records lr JOIN chapters ch ON lr.chapter_id = ch.id WHERE ch.course_id = ? AND lr.status = 'completed'", [course.id])
      progressMap.value[course.id] = total.count > 0 ? (completed.count / total.count) * 100 : 0
    } catch { progressMap.value[course.id] = 0 }
  }
})
function getProgress(courseId: number): number { return progressMap.value[courseId] || 0 }
</script>

<style scoped>
.learn-view { padding: var(--spacing-2xl); }
.category-filters { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); }
.filter-btn { padding: 6px 18px; border-radius: var(--radius-full); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 500; border: 1px solid var(--color-border); transition: all var(--transition-fast); }
.filter-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.filter-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--spacing-xl); }
.empty-wrap { margin-top: var(--spacing-3xl); }
</style>