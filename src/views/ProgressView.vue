<template>
  <div class="progress-view page-container fade-in">
    <h1 class="page-title">学习进度</h1>
    <div class="stats-grid">
      <StatCard :value="stats.totalMinutes + ' 分钟'" label="累计学习时长" icon-bg="#EDF4EE"><template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></template></StatCard>
      <StatCard :value="stats.totalCoursesCompleted" label="完成课程" icon-bg="#EDF7ED"><template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></template></StatCard>
      <StatCard :value="stats.streakDays + ' 天'" label="连续学习" icon-bg="#FDF8ED"><template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" stroke-width="2"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z"/></svg></template></StatCard>
      <StatCard :value="`${taskStats.passed}/${taskStats.total}`" label="任务通过" icon-bg="#EDF3F8"><template #icon><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8CB8" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></template></StatCard>
    </div>
    <div class="charts-grid">
      <DurationChart :data="progressData.dailyStats" />
      <WeeklyReport :weekly-minutes="weeklyMinutes" :tasks-completed="taskStats.passed" :streak-days="stats.streakDays" />
    </div>
    <div class="charts-grid"><CalendarHeatmap :data="progressData.dailyStats" /></div>
    <div class="course-progress-section card">
      <h3 class="section-title">课程完成度</h3>
      <div v-for="item in progressData.courseCompletion" :key="item.courseId" class="course-progress-item">
        <div class="course-progress-header"><span class="course-progress-name">{{ item.title }}</span><span class="course-progress-count">{{ item.completed }}/{{ item.total }}</span></div>
        <ProgressBar :percentage="item.total > 0 ? (item.completed / item.total) * 100 : 0" :show-label="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProgressStore } from '@/stores/progress'
import { storeToRefs } from 'pinia'
import StatCard from '@/components/common/StatCard.vue'
import DurationChart from '@/components/progress/DurationChart.vue'
import CalendarHeatmap from '@/components/progress/CalendarHeatmap.vue'
import WeeklyReport from '@/components/progress/WeeklyReport.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const progressStore = useProgressStore()
const { dashboardStats: stats, progressData } = storeToRefs(progressStore)
const taskStats = computed(() => progressData.value.taskStats)
const weeklyMinutes = computed(() => { const last7 = progressData.value.dailyStats.slice(-7); return last7.reduce((sum, d) => sum + d.minutes, 0) })

onMounted(async () => { await progressStore.loadDashboard(); await progressStore.loadProgressData() })
</script>

<style scoped>
.progress-view { padding: var(--spacing-2xl); }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl); }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); margin-bottom: var(--spacing-xl); }
.section-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xl); }
.course-progress-section { margin-top: var(--spacing-xl); }
.course-progress-item { margin-bottom: var(--spacing-lg); }
.course-progress-header { display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm); }
.course-progress-name { font-size: var(--font-size-base); font-weight: 500; }
.course-progress-count { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>