<template>
  <div class="course-detail-view fade-in" v-if="course">
    <div class="detail-sidebar">
      <router-link to="/learn" class="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3L5.5 8l5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        返回课程列表
      </router-link>
      <ChapterTree :chapters="chapters" :course-id="course.id" :active-chapter-id="activeChapterId" :completed-ids="completedIds" />
    </div>
    <div class="detail-content">
      <div class="course-header">
        <div><span class="tag tag-primary">{{ categoryLabel }}</span><span class="tag" :class="difficultyClass" style="margin-left:8px">{{ difficultyLabel }}</span></div>
        <h1 class="course-title">{{ course.title }}</h1>
        <p class="course-desc">{{ course.description }}</p>
        <ProgressBar :percentage="overallProgress" label="课程进度" />
      </div>
      <div class="chapters-preview">
        <h3>课程章节</h3>
        <div v-for="chapter in chapters" :key="chapter.id" class="chapter-preview-item" :class="{ completed: completedIds.has(chapter.id) }" @click="$router.push(`/learn/${course.id}/${chapter.id}`)">
          <span class="chapter-num">{{ chapter.sortOrder }}</span>
          <div class="chapter-preview-info"><span class="chapter-preview-title">{{ chapter.title }}</span><span class="chapter-preview-meta">{{ chapter.type === 'practice' ? '实操' : '理论' }} · {{ chapter.estimatedMinutes }}分钟</span></div>
          <span v-if="completedIds.has(chapter.id)" class="completed-badge">✓</span>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载中..." />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types'
import ChapterTree from '@/components/learn/ChapterTree.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = useCoursesStore()
const completedIds = ref(new Set<number>())
const activeChapterId = ref(0)
const courseId = computed(() => Number(route.params.courseId))
const course = computed(() => store.getCourseById(courseId.value))
const chapters = computed(() => store.getChaptersByCourseId(courseId.value))
const categoryLabel = computed(() => CATEGORY_LABELS[course.value?.category || 'basics'])
const difficultyLabel = computed(() => DIFFICULTY_LABELS[course.value?.difficulty || 'beginner'])
const difficultyClass = computed(() => {
  const map: Record<string, string> = { beginner: 'tag-success', intermediate: 'tag-warning', advanced: 'tag-primary' }
  return map[course.value?.difficulty || 'beginner'] || 'tag-primary'
})
const overallProgress = computed(() => chapters.value.length === 0 ? 0 : (completedIds.value.size / chapters.value.length) * 100)

onMounted(async () => {
  await store.loadChapters(courseId.value)
  const records = await window.electronAPI.dbQuery(`SELECT DISTINCT chapter_id FROM learning_records WHERE chapter_id IN (${chapters.value.map(c => c.id).join(',') || '0'}) AND status = 'completed'`)
  completedIds.value = new Set(records.map((r: any) => r.chapter_id))
})
</script>

<style scoped>
.course-detail-view { display: flex; min-height: calc(100vh - var(--header-height)); }
.detail-sidebar { width: 280px; background: var(--color-bg-card); border-right: 1px solid var(--color-border-light); padding-top: var(--spacing-lg); }
.back-link { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-lg); color: var(--color-text-secondary); font-size: var(--font-size-sm); text-decoration: none; }
.back-link:hover { color: var(--color-primary); }
.detail-content { flex: 1; padding: var(--spacing-2xl); overflow-y: auto; }
.course-header { margin-bottom: var(--spacing-2xl); }
.course-title { font-size: var(--font-size-3xl); font-weight: 700; margin: var(--spacing-md) 0; }
.course-desc { color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); font-size: var(--font-size-lg); }
.chapters-preview { margin-top: var(--spacing-2xl); }
.chapters-preview h3 { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-lg); }
.chapter-preview-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md) var(--spacing-lg); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); }
.chapter-preview-item:hover { background: var(--color-bg-hover); }
.chapter-preview-item.completed { opacity: 0.7; }
.chapter-num { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-primary-bg); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-sm); font-weight: 600; flex-shrink: 0; }
.chapter-preview-item.completed .chapter-num { background: var(--color-success-bg); color: var(--color-success); }
.chapter-preview-info { flex: 1; }
.chapter-preview-title { font-size: var(--font-size-base); font-weight: 500; }
.chapter-preview-meta { font-size: var(--font-size-xs); color: var(--color-text-light); display: block; margin-top: 2px; }
.completed-badge { color: var(--color-success); font-weight: 700; font-size: var(--font-size-lg); }
</style>