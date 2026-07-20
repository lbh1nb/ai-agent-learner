/* src/router/index.ts */
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('@/views/LearnView.vue')
    },
    {
      path: '/learn/:courseId',
      name: 'course-detail',
      component: () => import('@/views/CourseDetailView.vue')
    },
    {
      path: '/learn/:courseId/:chapterId',
      name: 'chapter',
      component: () => import('@/views/ChapterView.vue')
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticeView.vue')
    },
    {
      path: '/practice/:taskId',
      name: 'task',
      component: () => import('@/views/TaskView.vue')
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/views/ProgressView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router