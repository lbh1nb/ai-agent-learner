import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, Chapter, CourseCategory } from '@/types'

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref<Course[]>([])
  const chapters = ref<Map<number, Chapter[]>>(new Map())
  const currentCategory = ref<CourseCategory | 'all'>('all')
  const isLoading = ref(false)

  const filteredCourses = computed(() => {
    if (currentCategory.value === 'all') return courses.value
    return courses.value.filter(c => c.category === currentCategory.value)
  })

  async function loadCourses() {
    isLoading.value = true
    try {
      if (!window.electronAPI) { isLoading.value = false; return }
      const rows = await window.electronAPI.dbQuery('SELECT * FROM courses ORDER BY sort_order')
      courses.value = rows
    } catch (e) {
      console.error('Failed to load courses:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function loadChapters(courseId: number) {
    try {
      if (!window.electronAPI) return
      const rows = await window.electronAPI.dbQuery(
        'SELECT * FROM chapters WHERE course_id = ? ORDER BY sort_order',
        [courseId]
      )
      chapters.value.set(courseId, rows)
    } catch (e) {
      console.error('Failed to load chapters:', e)
    }
  }

  function getCourseById(id: number): Course | undefined {
    return courses.value.find(c => c.id === id)
  }

  function getChaptersByCourseId(courseId: number): Chapter[] {
    return chapters.value.get(courseId) || []
  }

  return { courses, chapters, currentCategory, isLoading, filteredCourses, loadCourses, loadChapters, getCourseById, getChaptersByCourseId }
})