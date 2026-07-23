<template>
  <div class="settings-view page-container fade-in">
    <h1 class="page-title">设置</h1>

    <div class="settings-section card">
      <h3 class="section-title">个人信息</h3>
      <div class="form-group"><label class="form-label">昵称</label><input v-model="nickname" class="input" type="text" placeholder="输入你的昵称" /></div>
      <button class="btn btn-primary" @click="saveProfile">保存</button>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">学习目标</h3>
      <div class="form-group"><label class="form-label">每日学习目标（分钟）</label><input v-model.number="dailyGoal" class="input" type="number" min="10" max="480" /></div>
      <button class="btn btn-primary" @click="saveGoal">保存</button>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">学习提醒</h3>
      <div class="form-group"><label class="form-check"><input v-model="reminderEnabled" type="checkbox" /><span>启用每日学习提醒</span></label></div>
      <div class="form-group" v-if="reminderEnabled"><label class="form-label">提醒时间</label><input v-model="reminderTime" class="input" type="time" /></div>
      <button class="btn btn-primary" @click="saveReminder">保存</button>
    </div>

    <!-- LLM API 配置 -->
    <div class="settings-section card">
      <h3 class="section-title">AI 助手配置</h3>
      <p class="section-desc">
        配置 LLM API Key 后，实操实验室的 AI 助手将调用真实大模型为你提供代码评审和答疑服务。
        未配置时使用本地模拟回复。支持 OpenAI 兼容接口（如 OpenAI、DeepSeek、Moonshot、SiliconFlow 等）。
      </p>

      <div class="form-group">
        <label class="form-label">API Key</label>
        <input
          v-model="llmApiKey"
          class="input"
          type="password"
          placeholder="sk-..."
          autocomplete="off"
        />
        <p class="form-hint">API Key 仅存储在本地 SQLite 数据库，不会上传到任何服务器。</p>
      </div>

      <div class="form-group">
        <label class="form-label">API Base URL</label>
        <input
          v-model="llmBaseUrl"
          class="input"
          type="text"
          placeholder="https://api.openai.com"
        />
        <p class="form-hint">
          常见服务商地址：<br />
          • OpenAI：https://api.openai.com<br />
          • DeepSeek：https://api.deepseek.com<br />
          • Moonshot：https://api.moonshot.cn<br />
          • SiliconFlow：https://api.siliconflow.cn
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">模型名称</label>
        <input
          v-model="llmModel"
          class="input"
          type="text"
          placeholder="gpt-3.5-turbo"
        />
        <p class="form-hint">
          常见模型：gpt-3.5-turbo、gpt-4o-mini、deepseek-chat、moonshot-v1-8k、Qwen/Qwen2.5-7B-Instruct
        </p>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="saveLlmConfig">保存配置</button>
        <button class="btn btn-outline" @click="testLlmConfig" :disabled="isTesting">
          {{ isTesting ? '测试中...' : '测试连接' }}
        </button>
      </div>

      <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
        {{ testResult.message }}
      </div>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">数据管理</h3>
      <p class="section-desc">导出或清除你的学习数据</p>
      <div class="form-actions"><button class="btn btn-outline" @click="exportData">导出数据</button><button class="btn btn-outline" style="color:var(--color-error);border-color:var(--color-error)" @click="clearData">清除数据</button></div>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">关于</h3>
      <p class="section-desc">AI Coding Learner v1.3.1</p>
      <p class="section-desc">一款帮助你学习 AI 编程的桌面应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { callLLM, isLLMConfigured } from '@/services/llm'

const userStore = useUserStore()
const nickname = ref('')
const dailyGoal = ref(30)
const reminderEnabled = ref(false)
const reminderTime = ref('09:00')

// LLM 配置
const llmApiKey = ref('')
const llmBaseUrl = ref('https://api.openai.com')
const llmModel = ref('gpt-3.5-turbo')
const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

onMounted(async () => {
  await userStore.loadConfig()
  nickname.value = userStore.config.nickname
  dailyGoal.value = userStore.config.dailyGoalMinutes
  reminderEnabled.value = userStore.config.reminderEnabled
  reminderTime.value = userStore.config.reminderTime
  llmApiKey.value = userStore.config.llmApiKey || ''
  llmBaseUrl.value = userStore.config.llmBaseUrl || 'https://api.openai.com'
  llmModel.value = userStore.config.llmModel || 'gpt-3.5-turbo'
})

async function saveProfile() { await userStore.updateConfig({ nickname: nickname.value }) }
async function saveGoal() { await userStore.updateConfig({ dailyGoalMinutes: dailyGoal.value }) }
async function saveReminder() { await userStore.updateConfig({ reminderEnabled: reminderEnabled.value, reminderTime: reminderTime.value }) }

async function saveLlmConfig() {
  await userStore.updateConfig({
    llmApiKey: llmApiKey.value,
    llmBaseUrl: llmBaseUrl.value,
    llmModel: llmModel.value
  })
  testResult.value = { success: true, message: '配置已保存。' }
  setTimeout(() => { testResult.value = null }, 3000)
}

async function testLlmConfig() {
  if (!llmApiKey.value.trim()) {
    testResult.value = { success: false, message: '请先填写 API Key' }
    return
  }
  isTesting.value = true
  testResult.value = null
  try {
    const reply = await callLLM(
      { apiKey: llmApiKey.value, baseUrl: llmBaseUrl.value, model: llmModel.value },
      [{ role: 'user', content: '请回复"连接成功"四个字' }]
    )
    testResult.value = {
      success: true,
      message: `连接成功！模型回复：${reply.slice(0, 50)}${reply.length > 50 ? '...' : ''}`
    }
  } catch (e: any) {
    testResult.value = { success: false, message: `连接失败：${e.message}` }
  } finally {
    isTesting.value = false
  }
}

async function exportData() { alert('数据导出功能将在后续版本中实现') }
async function clearData() { if (confirm('确定要清除所有学习数据吗？此操作不可恢复。')) { alert('数据清除功能将在后续版本中实现') } }
</script>

<style scoped>
.settings-view { padding: var(--spacing-2xl); max-width: 640px; }
.settings-section { margin-bottom: var(--spacing-xl); }
.section-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-lg); }
.section-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-lg); line-height: 1.6; }
.form-group { margin-bottom: var(--spacing-lg); }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); margin-bottom: var(--spacing-sm); }
.form-hint { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: var(--spacing-xs); line-height: 1.6; }
.form-group .input { width: 100%; max-width: 400px; }
.form-check { display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; font-size: var(--font-size-base); }
.form-actions { display: flex; gap: var(--spacing-md); }
.test-result { margin-top: var(--spacing-md); padding: var(--spacing-md); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.test-result.success { background: var(--color-success-bg); color: var(--color-success); }
.test-result.error { background: var(--color-error-bg); color: var(--color-error); }
</style>
