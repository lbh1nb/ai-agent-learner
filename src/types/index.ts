/* src/types/index.ts */

// 课程
export interface Course {
  id: number
  title: string
  category: CourseCategory
  difficulty: Difficulty
  description: string
  coverImage: string
  sortOrder: number
  createdAt: string
}

export type CourseCategory = 'basics' | 'agent' | 'practice' | 'advanced'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  basics: '基础入门',
  agent: 'Agent 原理',
  practice: '实战项目',
  advanced: '进阶技巧'
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级'
}

// 章节配套资源
export interface ChapterResource {
  title: string
  url: string
}

// 章节
export interface Chapter {
  id: number
  courseId: number
  title: string
  content: string
  type: ChapterType
  estimatedMinutes: number
  videoUrl: string | null
  sortOrder: number
  createdAt: string
  resources: ChapterResource[] | null
}

export type ChapterType = 'theory' | 'practice'

// 实操任务步骤（用于分步引导）
export interface TaskStep {
  title: string
  description: string
  hint: string
  referenceCode?: string      // 该步骤的参考代码示例
  expectedResult?: string     // 该步骤完成后的预期效果
}

// 测试用例（用于真实代码执行验证）
export interface TestCase {
  name: string
  input: any[]
  expected: any
  // 验证模式：equal=深度相等（默认）| contains=字符串包含 | length=数组长度 | throws=应抛出异常
  mode?: 'equal' | 'contains' | 'length' | 'throws'
  description?: string
}

// 实操任务
export interface Task {
  id: number
  chapterId: number | null
  title: string
  description: string
  initialCode: string
  solutionCode: string
  validationType: ValidationType
  validationValue: string
  difficulty: Difficulty
  sortOrder: number
  // 新增字段（可选，向后兼容）
  steps?: TaskStep[]          // 分步引导
  testCases?: TestCase[]      // 单元测试用例
  functionName?: string       // 需要测试的函数名
  hint?: string               // 整体提示
  isGuidedProject?: boolean   // 是否为综合实战引导项目
}

export type ValidationType = 'exact' | 'contains' | 'regex' | 'custom' | 'tests'

// 代码运行结果
export interface RunResult {
  passed: boolean
  totalTests: number
  passedTests: number
  results: Array<{
    name: string
    passed: boolean
    expected: string
    actual: string
    error?: string
  }>
  consoleOutput: string[]
  error?: string
}

// 学习记录
export interface LearningRecord {
  id: number
  chapterId: number
  taskId: number | null
  status: 'in_progress' | 'completed' | 'skipped'
  userCode: string | null
  startedAt: string
  completedAt: string | null
  durationSeconds: number
}

// 学习会话
export interface LearningSession {
  id: number
  date: string
  totalSeconds: number
  tasksCompleted: number
  createdAt: string
}

// 用户配置
export interface UserConfig {
  id: number
  nickname: string
  avatar: string | null
  dailyGoalMinutes: number
  reminderEnabled: boolean
  reminderTime: string
  createdAt: string
  // LLM 配置（用于实操实验室的 AI 助手）
  llmApiKey?: string
  llmBaseUrl?: string
  llmModel?: string
}

// AI 模拟对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

// 首页统计
export interface DashboardStats {
  todayMinutes: number
  todayTasksCompleted: number
  totalMinutes: number
  totalCoursesCompleted: number
  streakDays: number
  lastChapter: { courseId: number; chapterId: number; title: string; courseTitle: string } | null
}

// 进度统计
export interface ProgressData {
  dailyStats: { date: string; minutes: number }[]
  courseCompletion: { courseId: number; title: string; completed: number; total: number }[]
  taskStats: { passed: number; failed: number; total: number }
}
