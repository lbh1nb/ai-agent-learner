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

    <div class="settings-section card">
      <h3 class="section-title">数据管理</h3>
      <p class="section-desc">导出或清除你的学习数据</p>
      <div class="form-actions"><button class="btn btn-outline" @click="exportData">导出数据</button><button class="btn btn-outline" style="color:var(--color-error);border-color:var(--color-error)" @click="clearData">清除数据</button></div>
    </div>

    <div class="settings-section card">
      <h3 class="section-title">关于</h3>
      <p class="section-desc">AI Coding Learner v1.0.0</p>
      <p class="section-desc">一款帮助你学习 AI 编程的桌面应用</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const nickname = ref('')
const dailyGoal = ref(30)
const reminderEnabled = ref(false)
const reminderTime = ref('09:00')

onMounted(async () => {
  await userStore.loadConfig()
  nickname.value = userStore.config.nickname
  dailyGoal.value = userStore.config.dailyGoalMinutes
  reminderEnabled.value = userStore.config.reminderEnabled
  reminderTime.value = userStore.config.reminderTime
})

async function saveProfile() { await userStore.updateConfig({ nickname: nickname.value }) }
async function saveGoal() { await userStore.updateConfig({ dailyGoalMinutes: dailyGoal.value }) }
async function saveReminder() { await userStore.updateConfig({ reminderEnabled: reminderEnabled.value, reminderTime: reminderTime.value }) }
async function exportData() { alert('数据导出功能将在后续版本中实现') }
async function clearData() { if (confirm('确定要清除所有学习数据吗？此操作不可恢复。')) { alert('数据清除功能将在后续版本中实现') } }
</script>

<style scoped>
.settings-view { padding: var(--spacing-2xl); max-width: 640px; }
.settings-section { margin-bottom: var(--spacing-xl); }
.section-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-lg); }
.section-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-lg); }
.form-group { margin-bottom: var(--spacing-lg); }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); margin-bottom: var(--spacing-sm); }
.form-group .input { width: 100%; max-width: 320px; }
.form-check { display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; font-size: var(--font-size-base); }
.form-actions { display: flex; gap: var(--spacing-md); }
</style>