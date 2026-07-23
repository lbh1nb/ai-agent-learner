import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, ChatMessage, TestCase, RunResult, TaskStep } from '@/types'
import CodeRunnerWorker from '@/workers/code-runner.ts?worker'

// 单例 Worker：避免每次提交都新建 worker
const codeWorker = new CodeRunnerWorker()

export const usePracticeStore = defineStore('practice', () => {
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const userCode = ref('')
  const chatMessages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const startTime = ref<number>(0)

  // 分步引导状态
  const currentStepIndex = ref(0)
  // 测试结果
  const lastRunResult = ref<RunResult | null>(null)
  const isRunning = ref(false)

  // 当前任务步骤（已解析）
  const currentSteps = computed<TaskStep[]>(() => {
    if (!currentTask.value?.steps) return []
    if (Array.isArray(currentTask.value.steps)) return currentTask.value.steps
    try { return JSON.parse(currentTask.value.steps as unknown as string) } catch { return [] }
  })

  // 当前任务测试用例（已解析）
  const currentTestCases = computed<TestCase[]>(() => {
    if (!currentTask.value?.testCases) return []
    if (Array.isArray(currentTask.value.testCases)) return currentTask.value.testCases
    try { return JSON.parse(currentTask.value.testCases as unknown as string) } catch { return [] }
  })

  // 是否为测试型任务
  const isTestTask = computed(() => currentTask.value?.validationType === 'tests')
  // 是否为纯引导型任务（无代码运行，用户在自己的环境完成后手动标记完成）
  const isGuideTask = computed(() => currentTask.value?.validationType === 'guide')

  async function loadTasks() {
    isLoading.value = true
    try {
      if (!window.electronAPI) { isLoading.value = false; return }
      const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks ORDER BY sort_order')
      tasks.value = rows.map(parseTaskRow)
    } finally {
      isLoading.value = false
    }
  }

  // 将数据库行（snake_case + JSON 字符串）转换为前端 Task 对象
  function parseTaskRow(row: any): Task {
    const task: Task = {
      id: row.id,
      chapterId: row.chapter_id,
      title: row.title,
      description: row.description,
      initialCode: row.initial_code || '',
      solutionCode: row.solution_code || '',
      validationType: row.validation_type,
      validationValue: row.validation_value || '',
      difficulty: row.difficulty,
      sortOrder: row.sort_order,
      functionName: row.function_name || undefined,
      hint: row.hint || undefined,
      isGuidedProject: row.is_guided_project === 1
    }
    if (row.steps) {
      try { task.steps = JSON.parse(row.steps) } catch { /* */ }
    }
    if (row.test_cases) {
      try { task.testCases = JSON.parse(row.test_cases) } catch { /* */ }
    }
    return task
  }

  async function loadTask(taskId: number) {
    if (!window.electronAPI) return
    const rows = await window.electronAPI.dbQuery('SELECT * FROM tasks WHERE id = ?', [taskId])
    if (rows.length > 0) {
      currentTask.value = parseTaskRow(rows[0])
      userCode.value = rows[0].initial_code || ''
      chatMessages.value = []
      startTime.value = Date.now()
      currentStepIndex.value = 0
      lastRunResult.value = null

      // 恢复上次保存的代码
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

  /**
   * 提交代码验证
   * - tests 类型：通过 Web Worker 执行代码并运行测试用例
   * - 其他类型：使用原有逻辑（contains/exact/regex）
   */
  async function submitCode(): Promise<{ passed: boolean; message: string; result?: RunResult }> {
    if (!currentTask.value) return { passed: false, message: '无任务' }
    if (!window.electronAPI) return { passed: false, message: '非 Electron 环境' }

    const duration = Math.floor((Date.now() - startTime.value) / 1000)
    const task = currentTask.value

    let passed = false
    let result: RunResult | undefined
    let message = ''

    if (task.validationType === 'guide') {
      // 纯引导型任务：用户在自己的环境完成，软件只提供题目和引导，直接标记完成
      passed = true
      message = '已标记为完成！你可以在自己的 Agent 环境中继续实践。'
    } else if (task.validationType === 'tests') {
      // 通过 Web Worker 执行测试
      isRunning.value = true
      try {
        result = await runCodeViaWorker(userCode.value, task.functionName || '', currentTestCases.value)
        passed = result.passed
        lastRunResult.value = result
        message = passed
          ? `恭喜！全部 ${result.totalTests} 个测试用例通过！`
          : `${result.passedTests}/${result.totalTests} 个测试通过。${result.error ? result.error : ''}`
      } catch (e: any) {
        message = `代码执行失败：${e.message}`
      } finally {
        isRunning.value = false
      }
    } else {
      // 旧版验证逻辑
      const code = userCode.value.trim()
      const validation = task.validationType
      const expected = task.validationValue
      if (validation === 'contains' && code.includes(expected)) passed = true
      else if (validation === 'exact' && code === expected) passed = true
      else if (validation === 'regex' && new RegExp(expected).test(code)) passed = true
      message = passed ? '恭喜！代码验证通过！' : '代码尚未满足要求，请继续修改。'
    }

    // 更新学习记录
    const status = passed ? 'completed' : 'in_progress'
    await window.electronAPI.dbExecute(
      'UPDATE learning_records SET status = ?, user_code = ?, completed_at = datetime(\'now\'), duration_seconds = ? WHERE task_id = ? AND status = \'in_progress\'',
      [status, userCode.value, duration, task.id]
    )

    if (passed) {
      await window.electronAPI.dbExecute(
        `INSERT INTO learning_sessions (date, total_seconds, tasks_completed)
         VALUES (date('now'), ?, 1)
         ON CONFLICT(date) DO UPDATE SET total_seconds = total_seconds + ?, tasks_completed = tasks_completed + 1`,
        [duration, duration]
      )
    }

    return { passed, message, result }
  }

  /**
   * 通过 Web Worker 执行用户代码
   */
  function runCodeViaWorker(code: string, functionName: string, testCases: TestCase[]): Promise<RunResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          passed: false,
          totalTests: testCases.length,
          passedTests: 0,
          results: [],
          consoleOutput: [],
          error: '代码执行超时（可能是死循环或耗时操作）'
        })
      }, 5000) // 5 秒超时

      const handler = (e: MessageEvent<RunResult>) => {
        clearTimeout(timeout)
        codeWorker.removeEventListener('message', handler)
        resolve(e.data)
      }
      codeWorker.addEventListener('message', handler)
      codeWorker.postMessage({ code, functionName, testCases })
    })
  }

  function addChatMessage(role: 'user' | 'agent', content: string) {
    chatMessages.value.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      role,
      content,
      timestamp: new Date().toISOString()
    })
  }

  // 分步引导：跳转到下一步
  function nextStep() {
    if (currentStepIndex.value < currentSteps.value.length - 1) {
      currentStepIndex.value++
    }
  }

  // 分步引导：返回上一步
  function prevStep() {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  // 分步引导：跳转到指定步骤
  function goToStep(index: number) {
    if (index >= 0 && index < currentSteps.value.length) {
      currentStepIndex.value = index
    }
  }

  // 重置代码为初始代码
  function resetCode() {
    if (currentTask.value) {
      userCode.value = currentTask.value.initialCode
    }
  }

  // 清空测试结果
  function clearRunResult() {
    lastRunResult.value = null
  }

  return {
    // 状态
    tasks,
    currentTask,
    userCode,
    chatMessages,
    isLoading,
    isRunning,
    currentStepIndex,
    lastRunResult,
    // 计算属性
    currentSteps,
    currentTestCases,
    isTestTask, isGuideTask,
    // 方法
    loadTasks,
    loadTask,
    saveCode,
    submitCode,
    addChatMessage,
    nextStep,
    prevStep,
    goToStep,
    resetCode,
    clearRunResult
  }
})
