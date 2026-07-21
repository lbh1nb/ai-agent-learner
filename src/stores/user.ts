import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserConfig } from '@/types'

export const useUserStore = defineStore('user', () => {
  const config = ref<UserConfig>({
    id: 1,
    nickname: '学习者',
    avatar: null,
    dailyGoalMinutes: 30,
    reminderEnabled: false,
    reminderTime: '09:00',
    createdAt: '',
    llmApiKey: '',
    llmBaseUrl: 'https://api.openai.com',
    llmModel: 'gpt-3.5-turbo'
  })

  const isLoaded = ref(false)

  async function loadConfig() {
    try {
      if (!window.electronAPI) { isLoaded.value = true; return }
      const rows = await window.electronAPI.dbQuery('SELECT * FROM user_config WHERE id = 1')
      if (rows.length > 0) {
        config.value = {
          ...rows[0],
          reminderEnabled: rows[0].reminder_enabled === 1,
          avatar: rows[0].avatar || null,
          llmApiKey: rows[0].llm_api_key || '',
          llmBaseUrl: rows[0].llm_base_url || 'https://api.openai.com',
          llmModel: rows[0].llm_model || 'gpt-3.5-turbo'
        }
      }
      isLoaded.value = true
    } catch (e) {
      console.error('Failed to load user config:', e)
    }
  }

  async function updateConfig(updates: Partial<UserConfig>) {
    if (!window.electronAPI) { Object.assign(config.value, updates); return }
    const fields: string[] = []
    const values: any[] = []
    if (updates.nickname !== undefined) { fields.push('nickname = ?'); values.push(updates.nickname) }
    if (updates.dailyGoalMinutes !== undefined) { fields.push('daily_goal_minutes = ?'); values.push(updates.dailyGoalMinutes) }
    if (updates.reminderEnabled !== undefined) { fields.push('reminder_enabled = ?'); values.push(updates.reminderEnabled ? 1 : 0) }
    if (updates.reminderTime !== undefined) { fields.push('reminder_time = ?'); values.push(updates.reminderTime) }
    if (updates.llmApiKey !== undefined) { fields.push('llm_api_key = ?'); values.push(updates.llmApiKey) }
    if (updates.llmBaseUrl !== undefined) { fields.push('llm_base_url = ?'); values.push(updates.llmBaseUrl) }
    if (updates.llmModel !== undefined) { fields.push('llm_model = ?'); values.push(updates.llmModel) }
    if (fields.length > 0) {
      await window.electronAPI.dbExecute(`UPDATE user_config SET ${fields.join(', ')} WHERE id = 1`, values)
      Object.assign(config.value, updates)
    }
  }

  return { config, isLoaded, loadConfig, updateConfig }
})
