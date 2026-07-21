<template>
  <div class="task-view fade-in" v-if="store.currentTask">
    <!-- 左侧：代码编辑器 -->
    <div class="task-editor-panel">
      <CodeEditor
        v-model="store.userCode"
        :initial-code="store.currentTask.initialCode"
        @reset="handleReset"
      />
    </div>

    <!-- 右侧：任务面板 + 测试结果 + AI 对话 + 操作按钮 -->
    <div class="task-right-panel">
      <TaskPanel
        :task="store.currentTask"
        :steps="store.currentSteps"
        :current-step="store.currentStepIndex"
        @next-step="store.nextStep"
        @prev-step="store.prevStep"
        @go-to-step="store.goToStep"
      />

      <!-- 测试结果面板（仅 tests 类型任务显示） -->
      <div v-if="store.isTestTask && store.lastRunResult" class="test-result-panel card">
        <div class="test-result-header">
          <span class="test-result-title">
            {{ store.lastRunResult.passed ? '✓ 全部通过' : `${store.lastRunResult.passedTests}/${store.lastRunResult.totalTests} 通过` }}
          </span>
          <button class="btn btn-outline btn-sm" @click="store.clearRunResult">关闭</button>
        </div>

        <!-- 错误信息 -->
        <div v-if="store.lastRunResult.error" class="test-error">
          <span>⚠️</span>
          <span>{{ store.lastRunResult.error }}</span>
        </div>

        <!-- 测试用例结果 -->
        <div v-else class="test-cases">
          <div
            v-for="(tc, idx) in store.lastRunResult.results"
            :key="idx"
            class="test-case-item"
            :class="tc.passed ? 'passed' : 'failed'"
          >
            <div class="test-case-header">
              <span class="test-case-icon">{{ tc.passed ? '✓' : '✗' }}</span>
              <span class="test-case-name">{{ tc.name }}</span>
            </div>
            <div v-if="!tc.passed" class="test-case-detail">
              <div class="detail-row">
                <span class="detail-label">期望：</span>
                <code class="detail-value">{{ tc.expected }}</code>
              </div>
              <div class="detail-row">
                <span class="detail-label">实际：</span>
                <code class="detail-value">{{ tc.actual || '(空)' }}</code>
              </div>
              <div v-if="tc.error" class="detail-row">
                <span class="detail-label">错误：</span>
                <code class="detail-value error">{{ tc.error }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- 控制台输出 -->
        <div v-if="store.lastRunResult.consoleOutput.length > 0" class="console-output">
          <div class="console-title">控制台输出</div>
          <pre class="console-content">{{ store.lastRunResult.consoleOutput.join('\n') }}</pre>
        </div>
      </div>

      <AiChatSimulator
        ref="chatRef"
        :messages="store.chatMessages"
        :current-code="store.userCode"
        @send="handleSend"
      />

      <div class="task-actions">
        <button class="btn btn-outline" @click="handleSave" :disabled="store.isRunning">保存代码</button>
        <button class="btn btn-primary" @click="handleSubmit" :disabled="store.isRunning">
          {{ store.isRunning ? '运行中...' : '运行测试' }}
        </button>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <div v-if="result.show" class="result-overlay" @click="result.show = false">
      <div class="result-card card" :class="result.passed ? 'success' : 'failed'" @click.stop>
        <div class="result-icon"><span v-if="result.passed">&#10003;</span><span v-else>&#10007;</span></div>
        <h2 class="result-title">{{ result.passed ? '验证通过！' : '还需要改进' }}</h2>
        <p class="result-message">{{ result.message }}</p>
        <div class="result-actions">
          <button class="btn btn-outline" @click="result.show = false">继续编辑</button>
          <router-link v-if="result.passed" to="/practice" class="btn btn-primary">返回任务列表</router-link>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-else text="加载任务中..." />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeStore } from '@/stores/practice'
import { useUserStore } from '@/stores/user'
import { callLLM } from '@/services/llm'
import CodeEditor from '@/components/practice/CodeEditor.vue'
import TaskPanel from '@/components/practice/TaskPanel.vue'
import AiChatSimulator from '@/components/practice/AiChatSimulator.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = usePracticeStore()
const userStore = useUserStore()
const result = reactive({ show: false, passed: false, message: '' })
const taskId = Number(route.params.taskId)
const chatRef = ref<InstanceType<typeof AiChatSimulator> | null>(null)

onMounted(async () => {
  await Promise.all([
    store.loadTask(taskId),
    userStore.loadConfig()
  ])
})

function handleReset() {
  store.resetCode()
}

async function handleSave() {
  await store.saveCode()
}

async function handleSubmit() {
  const res = await store.submitCode()
  // 仅在非测试型任务或全部通过/全部失败时显示弹窗
  // 测试型任务的详细结果在右侧面板显示
  if (!store.isTestTask || res.passed) {
    result.show = true
    result.passed = res.passed
    result.message = res.message
  }
}

/**
 * 处理 AI 对话：优先调用真实 LLM，无 API Key 时降级到模拟回复
 */
async function handleSend(content: string) {
  store.addChatMessage('user', content)

  // 显示思考中动画
  chatRef.value?.setThinking(true)

  try {
    // 构造历史消息（最近 6 条）
    const history = store.chatMessages
      .slice(-7, -1) // 排除刚添加的用户消息
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content
      }))

    const reply = await callLLM(
      {
        apiKey: userStore.config.llmApiKey || '',
        baseUrl: userStore.config.llmBaseUrl || '',
        model: userStore.config.llmModel || ''
      },
      [...history, { role: 'user' as const, content }],
      { code: store.userCode }
    )

    store.addChatMessage('agent', reply)
  } catch (error: any) {
    store.addChatMessage('agent', `抱歉，调用 AI 时出错：${error.message}`)
  } finally {
    chatRef.value?.setThinking(false)
  }
}
</script>

<style scoped>
.task-view { display: flex; height: calc(100vh - var(--header-height)); }
.task-editor-panel { flex: 1; padding: var(--spacing-md); min-width: 0; }
.task-right-panel { width: 420px; display: flex; flex-direction: column; gap: var(--spacing-md); padding: var(--spacing-md); padding-left: 0; overflow: hidden; }
.task-right-panel > :first-child { max-height: 40%; flex-shrink: 0; }
.test-result-panel { flex-shrink: 0; max-height: 35%; overflow: hidden; display: flex; flex-direction: column; padding: var(--spacing-md); }
.task-right-panel > :nth-child(3) { flex: 1; min-height: 0; }

/* 测试结果面板 */
.test-result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-sm); }
.test-result-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.test-error { display: flex; gap: var(--spacing-sm); padding: var(--spacing-sm); background: var(--color-error-bg); border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--color-error); }
.test-cases { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--spacing-xs); }
.test-case-item { padding: var(--spacing-sm); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.test-case-item.passed { background: var(--color-success-bg); }
.test-case-item.failed { background: var(--color-error-bg); }
.test-case-header { display: flex; align-items: center; gap: var(--spacing-sm); }
.test-case-icon { font-weight: bold; }
.test-case-item.passed .test-case-icon { color: var(--color-success); }
.test-case-item.failed .test-case-icon { color: var(--color-error); }
.test-case-name { font-weight: 500; }
.test-case-detail { margin-top: var(--spacing-xs); padding-left: var(--spacing-lg); display: flex; flex-direction: column; gap: 2px; }
.detail-row { display: flex; gap: var(--spacing-xs); font-size: var(--font-size-xs); }
.detail-label { color: var(--color-text-secondary); flex-shrink: 0; }
.detail-value { font-family: var(--font-family-mono); word-break: break-all; }
.detail-value.error { color: var(--color-error); }
.console-output { margin-top: var(--spacing-sm); border-top: 1px solid var(--color-border-light); padding-top: var(--spacing-sm); }
.console-title { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: var(--spacing-xs); }
.console-content { background: #1e1e1e; color: #d4d4d4; padding: var(--spacing-sm); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-family: var(--font-family-mono); max-height: 80px; overflow-y: auto; margin: 0; }

.task-actions { display: flex; gap: var(--spacing-md); flex-shrink: 0; }
.task-actions button { flex: 1; padding: 10px 0; }

.result-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 200; }
.result-card { width: 400px; text-align: center; padding: var(--spacing-2xl); }
.result-card.success .result-icon { color: var(--color-success); }
.result-card.failed .result-icon { color: var(--color-warning); }
.result-icon { font-size: 48px; margin-bottom: var(--spacing-md); }
.result-title { font-size: var(--font-size-xl); margin-bottom: var(--spacing-sm); }
.result-message { color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); }
.result-actions { display: flex; gap: var(--spacing-md); justify-content: center; }
</style>
