import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, Chapter, CourseCategory, ChapterResource } from '@/types'

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
      // 解析 resources JSON 字段，并将数据库下划线字段映射为前端驼峰字段
      const parsed = rows.map((row: any) => ({
        ...row,
        videoUrl: row.video_url ?? null,  // 数据库 video_url → 前端 videoUrl
        resources: row.resources ? (JSON.parse(row.resources) as ChapterResource[]) : null
      })) as Chapter[]
      chapters.value.set(courseId, parsed)
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

  function setCurrentCategory(cat: CourseCategory | 'all') {
    currentCategory.value = cat
  }

  return { courses, chapters, currentCategory, isLoading, filteredCourses, loadCourses, loadChapters, getCourseById, getChaptersByCourseId, setCurrentCategory }
})