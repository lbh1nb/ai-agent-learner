<template>
  <div class="weekly-report card">
    <h3 class="report-title">本周学习报告</h3>
    <div class="report-stats">
      <div class="report-stat"><span class="report-stat-value">{{ weeklyMinutes }}</span><span class="report-stat-label">本周学习(分钟)</span></div>
      <div class="report-divider"></div>
      <div class="report-stat"><span class="report-stat-value">{{ tasksCompleted }}</span><span class="report-stat-label">完成任务</span></div>
      <div class="report-divider"></div>
      <div class="report-stat"><span class="report-stat-value">{{ streakDays }}</span><span class="report-stat-label">连续天数</span></div>
    </div>
    <div class="report-tip">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zM8 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7z"/></svg>
      <span>{{ tip }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ weeklyMinutes: number; tasksCompleted: number; streakDays: number }>()
const tip = computed(() => {
  if (props.weeklyMinutes < 30) return '每天坚持学习，积少成多！建议从理论课程开始。'
  if (props.weeklyMinutes < 120) return '不错的开始！尝试完成更多实操任务来巩固知识。'
  if (props.weeklyMinutes < 300) return '学习状态很好！继续保持，可以挑战更高难度的课程。'
  return '太棒了！你是学习达人，试试完成所有高级课程吧！'
})
</script>

<style scoped>
.weekly-report { padding: var(--spacing-xl); }
.report-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xl); }
.report-stats { display: flex; align-items: center; justify-content: space-around; margin-bottom: var(--spacing-xl); }
.report-stat { display: flex; flex-direction: column; align-items: center; }
.report-stat-value { font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-primary); }
.report-stat-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--spacing-xs); }
.report-divider { width: 1px; height: 40px; background: var(--color-border); }
.report-tip { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md) var(--spacing-lg); background: var(--color-primary-bg); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--color-primary-dark); }
</style>