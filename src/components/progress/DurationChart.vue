<template>
  <div class="duration-chart card">
    <h3 class="chart-title">学习时长趋势</h3>
    <div class="chart-container">
      <div class="chart-bars">
        <div v-for="(item, index) in data" :key="index" class="bar-wrapper">
          <div class="bar-value">{{ item.minutes }}分</div>
          <div class="bar" :style="{ height: barHeight(item.minutes) + '%' }"></div>
          <div class="bar-label">{{ formatDate(item.date) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ data: { date: string; minutes: number }[] }>()
function barHeight(minutes: number): number { return Math.min((minutes / 120) * 100, 100) }
function formatDate(dateStr: string): string { const d = new Date(dateStr); return `${d.getMonth() + 1}/${d.getDate()}` }
</script>

<style scoped>
.duration-chart { padding: var(--spacing-xl); }
.chart-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xl); }
.chart-container { height: 200px; }
.chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 100%; padding-top: 20px; }
.bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar-value { font-size: 10px; color: var(--color-text-light); margin-bottom: 4px; white-space: nowrap; }
.bar { width: 100%; max-width: 32px; background: var(--color-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; min-height: 4px; transition: height 0.5s ease; }
.bar-label { font-size: 10px; color: var(--color-text-light); margin-top: 6px; white-space: nowrap; }
</style>