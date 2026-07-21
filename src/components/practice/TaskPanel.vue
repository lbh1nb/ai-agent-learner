<template>
  <div class="task-panel">
    <div class="task-header">
      <div class="task-header-left">
        <h3 class="task-title">{{ task.title }}</h3>
        <div class="task-tags">
          <span class="tag" :class="difficultyClass">{{ difficultyLabel }}</span>
          <span v-if="task.isGuidedProject" class="tag tag-primary">引导项目</span>
        </div>
      </div>
    </div>

    <div class="task-body">
      <!-- 任务描述 -->
      <div class="task-description" v-html="renderedDescription"></div>

      <!-- 分步引导 -->
      <div v-if="steps.length > 0" class="step-guide">
        <div class="step-header">
          <span class="step-title">分步引导</span>
          <span class="step-progress">步骤 {{ currentStep + 1 }} / {{ steps.length }}</span>
        </div>

        <!-- 步骤进度条 -->
        <div class="step-progress-bar">
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            class="step-dot"
            :class="{ active: idx === currentStep, done: idx < currentStep }"
            @click="$emit('go-to-step', idx)"
            :title="step.title"
          ></div>
        </div>

        <!-- 当前步骤内容 -->
        <div class="step-content">
          <h4 class="step-name">{{ currentStepData.title }}</h4>
          <p class="step-desc">{{ currentStepData.description }}</p>
          <div class="step-hint" v-if="showHint">
            <span class="hint-icon">💡</span>
            <span class="hint-text">{{ currentStepData.hint }}</span>
          </div>
          <button v-else class="hint-toggle" @click="showHint = true">显示提示</button>
        </div>

        <!-- 步骤导航 -->
        <div class="step-nav">
          <button class="btn btn-outline btn-sm" :disabled="currentStep === 0" @click="$emit('prev-step')">上一步</button>
          <button v-if="currentStep < steps.length - 1" class="btn btn-primary btn-sm" @click="$emit('next-step')">下一步</button>
          <span v-else class="step-finish">✓ 已是最后一步</span>
        </div>
      </div>

      <!-- 整体提示 -->
      <div v-if="task.hint" class="task-hint">
        <span class="hint-icon">📌</span>
        <span class="hint-text">{{ task.hint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, TaskStep } from '@/types'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  task: Task
  steps: TaskStep[]
  currentStep: number
}>()

defineEmits<{
  'next-step': []
  'prev-step': []
  'go-to-step': [index: number]
}>()

const md = new MarkdownIt({ breaks: true })
const renderedDescription = computed(() => md.render(props.task.description))
const showHint = ref(false)

const currentStepData = computed(() => props.steps[props.currentStep] || { title: '', description: '', hint: '' })

const difficultyLabel = computed(() => {
  const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
  return map[props.task.difficulty] || props.task.difficulty
})

const difficultyClass = computed(() => {
  const map: Record<string, string> = { easy: 'tag-success', medium: 'tag-warning', hard: 'tag-primary' }
  return map[props.task.difficulty] || 'tag-primary'
})

// 切换步骤时重置提示显示
watch(() => props.currentStep, () => { showHint.value = false })
</script>

<style scoped>
.task-panel { display: flex; flex-direction: column; height: 100%; background: var(--color-bg-card); border-radius: var(--radius-lg); overflow: hidden; }
.task-header { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-lg); border-bottom: 1px solid var(--color-border-light); }
.task-header-left { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.task-title { font-size: var(--font-size-lg); font-weight: 600; }
.task-tags { display: flex; gap: var(--spacing-xs); }
.task-body { flex: 1; padding: var(--spacing-lg); overflow-y: auto; }
.task-description { font-size: var(--font-size-base); color: var(--color-text); line-height: 1.8; margin-bottom: var(--spacing-lg); }
.task-description :deep(h1), .task-description :deep(h2) { font-size: var(--font-size-lg); margin-bottom: var(--spacing-md); }
.task-description :deep(p) { margin-bottom: var(--spacing-md); }
.task-description :deep(ul), .task-description :deep(ol) { padding-left: var(--spacing-xl); margin-bottom: var(--spacing-md); }
.task-description :deep(pre) { background: #f6f8fa; padding: var(--spacing-md); border-radius: var(--radius-sm); font-size: var(--font-size-sm); overflow-x: auto; }
.task-description :deep(code) { font-family: var(--font-family-mono); font-size: 0.9em; background: var(--color-primary-bg); padding: 2px 6px; border-radius: var(--radius-sm); }
.task-description :deep(strong) { font-weight: 600; }

/* 分步引导 */
.step-guide { background: var(--color-primary-bg); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-top: var(--spacing-lg); }
.step-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
.step-title { font-size: var(--font-size-base); font-weight: 600; color: var(--color-primary-dark); }
.step-progress { font-size: var(--font-size-xs); color: var(--color-text-secondary); }

.step-progress-bar { display: flex; gap: var(--spacing-xs); margin-bottom: var(--spacing-lg); }
.step-dot { width: 28px; height: 4px; border-radius: var(--radius-full); background: var(--color-border); cursor: pointer; transition: all var(--transition-fast); }
.step-dot.active { background: var(--color-primary); width: 36px; }
.step-dot.done { background: var(--color-success); }

.step-content { background: var(--color-bg-card); border-radius: var(--radius-sm); padding: var(--spacing-md); margin-bottom: var(--spacing-md); }
.step-name { font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--spacing-sm); color: var(--color-primary-dark); }
.step-desc { font-size: var(--font-size-sm); color: var(--color-text); line-height: 1.6; margin-bottom: var(--spacing-sm); }
.step-hint, .task-hint { display: flex; gap: var(--spacing-sm); align-items: flex-start; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-warning-bg); border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--color-text); }
.hint-icon { flex-shrink: 0; }
.hint-text { line-height: 1.5; }
.hint-toggle { background: none; border: none; color: var(--color-primary); font-size: var(--font-size-sm); cursor: pointer; padding: var(--spacing-xs) 0; }
.hint-toggle:hover { text-decoration: underline; }

.step-nav { display: flex; gap: var(--spacing-sm); align-items: center; }
.step-finish { font-size: var(--font-size-sm); color: var(--color-success); }

.task-hint { margin-top: var(--spacing-lg); }
</style>
