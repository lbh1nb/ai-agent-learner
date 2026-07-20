<template>
  <div class="task-view fade-in" v-if="store.currentTask">
    <div class="task-editor-panel"><CodeEditor v-model="store.userCode" /></div>
    <div class="task-right-panel">
      <TaskPanel :task="store.currentTask" />
      <AiChatSimulator :messages="store.chatMessages" :current-code="store.userCode" @send="handleSend" />
      <div class="task-actions">
        <button class="btn btn-outline" @click="handleSave">保存代码</button>
        <button class="btn btn-primary" @click="handleSubmit">提交验证</button>
      </div>
    </div>
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
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeStore } from '@/stores/practice'
import CodeEditor from '@/components/practice/CodeEditor.vue'
import TaskPanel from '@/components/practice/TaskPanel.vue'
import AiChatSimulator from '@/components/practice/AiChatSimulator.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const store = usePracticeStore()
const result = reactive({ show: false, passed: false, message: '' })
const taskId = Number(route.params.taskId)

onMounted(() => { store.loadTask(taskId) })

async function handleSave() { await store.saveCode() }

async function handleSubmit() {
  const res = await store.submitCode()
  result.show = true
  result.passed = res.passed
  result.message = res.message
}

function handleSend(content: string) {
  store.addChatMessage('user', content)
  setTimeout(() => {
    const responses: Record<string, string> = {
      '分析': '我来分析你的代码：\n\n1. 代码结构清晰，变量命名合理\n2. 建议添加错误处理逻辑\n3. 可以考虑提取重复代码为独立函数\n\n继续加油！',
      '优化': '以下是我的优化建议：\n\n1. 使用更高效的数据结构\n2. 添加缓存层减少重复计算\n3. 考虑异步处理提升性能',
      '修复': '我发现了以下问题：\n\n1. 缺少空值检查\n2. 循环逻辑可以优化\n3. 建议添加类型注解\n\n请尝试修改后再次提交。',
      '帮助': '我可以帮你：\n- 分析代码质量\n- 提供优化建议\n- 指出潜在 Bug\n- 解释代码逻辑\n\n试试输入「分析」或「优化」来获取具体建议。'
    }
    let response = '我收到了你的消息。请描述具体问题，比如「分析这段代码」或「给出优化建议」，我会尽力帮助你。'
    for (const [key, val] of Object.entries(responses)) { if (content.includes(key)) { response = val; break } }
    store.addChatMessage('agent', response)
  }, 800)
}
</script>

<style scoped>
.task-view { display: flex; height: calc(100vh - var(--header-height)); }
.task-editor-panel { flex: 1; padding: var(--spacing-md); min-width: 0; }
.task-right-panel { width: 400px; display: flex; flex-direction: column; gap: var(--spacing-md); padding: var(--spacing-md); padding-left: 0; }
.task-right-panel > :first-child { max-height: 35%; }
.task-right-panel > :nth-child(2) { flex: 1; }
.task-actions { display: flex; gap: var(--spacing-md); }
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