import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, ChatMessage } from '@/types'

export const usePracticeStore = defineStore('practice', () => {
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const userCode = ref('')
  const chatMessages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const startTime = ref<number>(0)

  async function loadTasks() {
    isLoading.value = true
    try {
      if (!window.electronAPI) { isLoading.value = false; return }
      const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks ORDER BY sort_order')
      tasks.value = rows
    } finally {
      isLoading.value = false
    }
  }

  async function loadTask(taskId: number) {
    if (!window.electronAPI) return
    const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks WHERE id = ?', [taskId])
    if (rows.length > 0) {
      currentTask.value = rows[0]
      userCode.value = rows[0].initial_code || ''
      chatMessages.value = []
      startTime.value = Date.now()

      const records = await window.electronAPI.dbQuery(
        'SELECT user_code FROM learning_records WHERE task_id = ? AND status = ? ORDER BY id DESC LIMIT 1',
        [taskId, 'in_progress']
      )
      if (records.length > 0 && records[0].user_code) {
        userCode.value = records[0].user_code
      }

      await window.electronAPI.dbExecute(
        'INSERT OR IGNORE INTO learning_records (chapter_id, task_id, status) VALUES (?, ?, ?)',
        [currentTask.value.chapterId, taskId, 'in_progress']
      )
    }
  }

  async function saveCode() {
    if (currentTask.value && window.electronAPI) {
      await window.electronAPI.saveCode(currentTask.value.id, userCode.value)
    }
  }

  async function submitCode(): Promise<{ passed: boolean; message: string }> {
    if (!currentTask.value) return { passed: false, message: '无任务' }
    if (!window.electronAPI) return { passed: false, message: '非 Electron 环境' }

    const duration = Math.floor((Date.now() - startTime.value) / 1000)
    const code = userCode.value.trim()
    const validation = currentTask.value.validationType
    const expected = currentTask.value.validationValue

    let passed = false
    if (validation === 'contains' && code.includes(expected)) passed = true
    else if (validation === 'exact' && code === expected) passed = true
    else if (validation === 'regex' && new RegExp(expected).test(code)) passed = true

    const status = passed ? 'completed' : 'in_progress'
    await window.electronAPI.dbExecute(
      'UPDATE learning_records SET status = ?, user_code = ?, completed_at = datetime(\'now\'), duration_seconds = ? WHERE task_id = ? AND status = \'in_progress\'',
      [status, userCode.value, duration, currentTask.value.id]
    )

    if (passed) {
      await window.electronAPI.dbExecute(
        `INSERT INTO learning_sessions (date, total_seconds, tasks_completed)
         VALUES (date('now'), ?, 1)
         ON CONFLICT(date) DO UPDATE SET total_seconds = total_seconds + ?, tasks_completed = tasks_completed + 1`,
        [duration, duration]
      )
    }

    return {
      passed,
      message: passed ? '恭喜！代码验证通过！' : '代码尚未满足要求，请继续修改。'
    }
  }

  function addChatMessage(role: 'user' | 'agent', content: string) {
    chatMessages.value.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString()
    })
  }

  return { tasks, currentTask, userCode, chatMessages, isLoading, loadTasks, loadTask, saveCode, submitCode, addChatMessage }
})