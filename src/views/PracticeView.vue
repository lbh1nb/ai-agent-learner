<template>
  <div class="practice-view page-container fade-in">
    <h1 class="page-title">实操实验室</h1>
    <p class="page-subtitle">通过动手实践，巩固所学知识，提升 AI 编程能力</p>
    <LoadingSpinner v-if="store.isLoading" text="加载任务中..." />
    <div v-else-if="store.tasks.length === 0" class="empty-wrap"><EmptyState title="暂无任务" description="请先完成相关课程后，再来挑战实操任务" /></div>
    <div v-else class="tasks-grid">
      <div v-for="task in store.tasks" :key="task.id" class="task-card card" @click="$router.push(`/practice/${task.id}`)">
        <div class="task-header"><h3 class="task-title">{{ task.title }}</h3><span class="tag" :class="difficultyClass(task.difficulty)">{{ difficultyLabel(task.difficulty) }}</span></div>
        <p class="task-desc">{{ task.description }}</p>
        <div class="task-footer"><span class="task-status" :class="getStatus(task.id)">{{ statusText(task.id) }}</span><span class="btn btn-sm btn-primary">开始挑战</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePracticeStore } from '@/stores/practice'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePracticeStore()
const taskStatuses = ref<Record<number, string>>({})

onMounted(async () => {
  await store.loadTasks()
  for (const task of store.tasks) {
    try {
      const [record] = await window.electronAPI.dbQuery('SELECT status FROM learning_records WHERE task_id = ? ORDER BY id DESC LIMIT 1', [task.id])
      taskStatuses.value[task.id] = record?.status || 'not_started'
    } catch { taskStatuses.value[task.id] = 'not_started' }
  }
})
function difficultyLabel(d: string) { const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }; return map[d] || d }
function difficultyClass(d: string) { const map: Record<string, string> = { easy: 'tag-success', medium: 'tag-warning', hard: 'tag-primary' }; return map[d] || 'tag-primary' }
function getStatus(taskId: number) { return taskStatuses.value[taskId] || 'not_started' }
function statusText(taskId: number) { const map: Record<string, string> = { not_started: '未开始', in_progress: '进行中', completed: '已完成' }; return map[getStatus(taskId)] || '未开始' }
</script>

<style scoped>
.practice-view { padding: var(--spacing-2xl); }
.page-subtitle { color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); margin-top: -12px; }
.tasks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--spacing-xl); }
.task-card { cursor: pointer; display: flex; flex-direction: column; gap: var(--spacing-md); }
.task-card:hover { border-color: var(--color-primary); }
.task-header { display: flex; align-items: center; justify-content: space-between; }
.task-title { font-size: var(--font-size-lg); font-weight: 600; }
.task-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); flex: 1; }
.task-footer { display: flex; align-items: center; justify-content: space-between; }
.task-status { font-size: var(--font-size-sm); font-weight: 500; }
.task-status.not_started { color: var(--color-text-light); }
.task-status.in_progress { color: var(--color-warning); }
.task-status.completed { color: var(--color-success); }
</style>