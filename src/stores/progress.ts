import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardStats, ProgressData } from '@/types'

export const useProgressStore = defineStore('progress', () => {
  const dashboardStats = ref<DashboardStats>({
    todayMinutes: 0,
    todayTasksCompleted: 0,
    totalMinutes: 0,
    totalCoursesCompleted: 0,
    streakDays: 0,
    lastChapter: null
  })

  const progressData = ref<ProgressData>({
    dailyStats: [],
    courseCompletion: [],
    taskStats: { passed: 0, failed: 0, total: 0 }
  })

  const isLoading = ref(false)

  async function loadDashboard() {
    isLoading.value = true
    try {
      if (!window.electronAPI) { isLoading.value = false; return }
      const [todaySession] = await window.electronAPI.dbQuery(
        "SELECT total_seconds, tasks_completed FROM learning_sessions WHERE date = date('now')"
      )
      const [totalResult] = await window.electronAPI.dbQuery(
        'SELECT COALESCE(SUM(total_seconds), 0) as total_seconds FROM learning_sessions'
      )
      const [completedCourses] = await window.electronAPI.dbQuery(
        `SELECT COUNT(DISTINCT c.id) as count FROM courses c
         WHERE NOT EXISTS (SELECT 1 FROM chapters ch WHERE ch.course_id = c.id
         AND NOT EXISTS (SELECT 1 FROM learning_records lr WHERE lr.chapter_id = ch.id AND lr.status = 'completed'))`
      )
      const [lastRecord] = await window.electronAPI.dbQuery(
        `SELECT lr.chapter_id, ch.title, ch.course_id, c.title as course_title
         FROM learning_records lr
         JOIN chapters ch ON lr.chapter_id = ch.id
         JOIN courses c ON ch.course_id = c.id
         WHERE lr.status = 'in_progress'
         ORDER BY lr.started_at DESC LIMIT 1`
      )
      const [streakResult] = await window.electronAPI.dbQuery(
        `WITH RECURSIVE dates AS (
          SELECT date('now') as d
          UNION ALL SELECT date(d, '-1 day') FROM dates
          WHERE EXISTS (SELECT 1 FROM learning_sessions WHERE date = date(d, '-1 day'))
          LIMIT 365
        ) SELECT COUNT(*) as streak FROM dates`
      )

      dashboardStats.value = {
        todayMinutes: todaySession ? Math.floor((todaySession.total_seconds || 0) / 60) : 0,
        todayTasksCompleted: todaySession ? (todaySession.tasks_completed || 0) : 0,
        totalMinutes: Math.floor((totalResult?.total_seconds || 0) / 60),
        totalCoursesCompleted: completedCourses?.count || 0,
        streakDays: streakResult?.streak || 0,
        lastChapter: lastRecord ? {
          courseId: lastRecord.course_id,
          chapterId: lastRecord.chapter_id,
          title: lastRecord.title,
          courseTitle: lastRecord.course_title
        } : null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadProgressData() {
    try {
      if (!window.electronAPI) return
      const dailyStats = await window.electronAPI.dbQuery(
        `SELECT date, total_seconds as minutes FROM learning_sessions
         WHERE date >= date('now', '-30 days') ORDER BY date`
      )
      const courseCompletion = await window.electronAPI.dbQuery(
        `SELECT c.id as courseId, c.title,
          (SELECT COUNT(DISTINCT lr.chapter_id) FROM learning_records lr JOIN chapters ch ON lr.chapter_id = ch.id WHERE ch.course_id = c.id AND lr.status = 'completed') as completed,
          (SELECT COUNT(*) FROM chapters WHERE course_id = c.id) as total
         FROM courses c ORDER BY c.sort_order`
      )
      const taskStats = await window.electronAPI.dbQuery(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as passed,
          COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as failed,
          COUNT(*) as total
         FROM learning_records WHERE task_id IS NOT NULL`
      )

      progressData.value = {
        dailyStats: dailyStats.map((d: any) => ({ date: d.date, minutes: Math.floor(d.minutes / 60) })),
        courseCompletion,
        taskStats: taskStats[0] || { passed: 0, failed: 0, total: 0 }
      }
    } catch (e) {
      console.error('Failed to load progress data:', e)
    }
  }

  return { dashboardStats, progressData, isLoading, loadDashboard, loadProgressData }
})