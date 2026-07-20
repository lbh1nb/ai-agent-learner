<template>
  <div class="calendar-heatmap card">
    <h3 class="chart-title">学习日历</h3>
    <div class="heatmap-grid">
      <div v-for="day in days" :key="day.date" class="heatmap-cell" :class="getLevel(day.minutes)" :title="`${day.date}: ${day.minutes}分钟`"></div>
    </div>
    <div class="heatmap-legend">
      <span>少</span>
      <div class="legend-cell level-0"></div><div class="legend-cell level-1"></div><div class="legend-cell level-2"></div><div class="legend-cell level-3"></div><div class="legend-cell level-4"></div>
      <span>多</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ data: { date: string; minutes: number }[] }>()
const days = computed(() => {
  const result: { date: string; minutes: number }[] = []
  const dataMap = new Map(props.data.map(d => [d.date, d.minutes]))
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    result.push({ date: dateStr, minutes: dataMap.get(dateStr) || 0 })
  }
  return result
})
function getLevel(minutes: number): string {
  if (minutes === 0) return 'level-0'
  if (minutes <= 15) return 'level-1'
  if (minutes <= 30) return 'level-2'
  if (minutes <= 60) return 'level-3'
  return 'level-4'
}
</script>

<style scoped>
.calendar-heatmap { padding: var(--spacing-xl); }
.chart-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xl); }
.heatmap-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
.heatmap-cell { aspect-ratio: 1; border-radius: 3px; }
.heatmap-cell.level-0 { background: #ebedf0; }
.heatmap-cell.level-1 { background: #c6e0c6; }
.heatmap-cell.level-2 { background: #8bc48b; }
.heatmap-cell.level-3 { background: #4a9e4a; }
.heatmap-cell.level-4 { background: #2d6a2d; }
.heatmap-legend { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: var(--spacing-md); font-size: var(--font-size-xs); color: var(--color-text-light); }
.legend-cell { width: 14px; height: 14px; border-radius: 3px; }
</style>